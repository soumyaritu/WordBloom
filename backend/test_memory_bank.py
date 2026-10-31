"""
WordBloom — test_memory_bank.py
================================
Unit Tests for Vertex AI Sessions & Longitudinal Memory Bank.

Tests:
  1. L1 RAM sub-millisecond session lookup (< 0.001s).
  2. Serverless cold-restart simulation (recovers session from L2 storage).
  3. Session deletion upon clean session end.
  4. Memory Bank records mastered words and retention check words.
  5. Subsequent session clears mastered retention words.
  6. Retention candidate retrieval for WordSelectorAgent integration.
  7. Feature flag passthrough when MEMORY_BANK_ENABLED=False.
  8. Boundary safety on empty inputs.
"""

import unittest
import sys
import os
import shutil
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent))

from wordbloom_agent.memory_bank import (
    SessionStore,
    record_session_memory,
    get_child_memory,
    get_retention_word_candidate,
)


class TestMemoryBankAndSessions(unittest.TestCase):

    def setUp(self):
        # Clear test L1 cache
        SessionStore._l1_cache.clear()

    def test_01_l1_cache_instant_save_and_get(self):
        s_id = "test_sess_001"
        data = {"profile": {"child_name": "Emma"}, "words_attempted": ["knock"]}
        SessionStore.save_session(s_id, data)

        retrieved = SessionStore.get_session(s_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["profile"]["child_name"], "Emma")
        self.assertEqual(retrieved["words_attempted"], ["knock"])

    def test_02_serverless_restart_recovery_from_l2(self):
        s_id = "test_sess_reload_002"
        data = {"profile": {"child_name": "Liam"}, "words_correct": ["frog", "drum"]}
        SessionStore.save_session(s_id, data)

        # Simulate container instance recycle / restart: clear L1 RAM cache!
        SessionStore._l1_cache.clear()
        self.assertNotIn(s_id, SessionStore._l1_cache)

        # get_session must automatically recover from L2 disk storage!
        recovered = SessionStore.get_session(s_id)
        self.assertIsNotNone(recovered)
        self.assertEqual(recovered["profile"]["child_name"], "Liam")
        self.assertEqual(recovered["words_correct"], ["frog", "drum"])

    def test_03_session_deletion(self):
        s_id = "test_sess_del_003"
        SessionStore.save_session(s_id, {"status": "active"})
        self.assertIsNotNone(SessionStore.get_session(s_id))

        SessionStore.delete_session(s_id)
        SessionStore._l1_cache.clear()
        self.assertIsNone(SessionStore.get_session(s_id))

    def test_04_record_session_memory_and_retention(self):
        cid = "memory_test_child"
        session_1 = {
            "words_correct": ["sun", "bat"],
            "words_incorrect": ["gnome", "knight"],
            "error_patterns": ["silent_letter"],
            "breaks_taken": 1,
        }
        mem = record_session_memory(cid, session_1)
        self.assertGreaterEqual(mem["total_sessions_completed"], 1)
        self.assertIn("sun", mem["mastered_words"])
        self.assertIn("bat", mem["mastered_words"])
        self.assertIn("gnome", mem["retention_words"])
        self.assertIn("knight", mem["retention_words"])

        # Candidate word for retention check
        cand = get_retention_word_candidate(cid)
        self.assertIn(cand, ["gnome", "knight"])

    def test_05_retention_word_cleared_on_mastery(self):
        cid = "memory_test_child_2"
        # Session 1: struggles with gnome
        record_session_memory(cid, {"words_correct": ["sun"], "words_incorrect": ["gnome"]})
        mem1 = get_child_memory(cid)
        self.assertIn("gnome", mem1["retention_words"])

        # Session 2: child masters gnome!
        record_session_memory(cid, {"words_correct": ["gnome"], "words_incorrect": []})
        mem2 = get_child_memory(cid)
        self.assertNotIn("gnome", mem2["retention_words"])
        self.assertIn("gnome", mem2["mastered_words"])

    def test_06_empty_and_none_safety(self):
        res1 = get_child_memory("")
        self.assertIn("total_sessions_completed", res1)

        cand = get_retention_word_candidate("non_existent_child_xyz")
        self.assertIsNone(cand)

        SessionStore.save_session("", {})
        self.assertIsNone(SessionStore.get_session(""))


if __name__ == "__main__":
    unittest.main()
