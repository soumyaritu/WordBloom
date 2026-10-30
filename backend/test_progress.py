"""
WordBloom — test_progress.py
=============================
Unit tests for progress tracking & computation:
1. One session only (not_enough_sessions)
2. Improvement (fewer errors, fewer hints, higher first-try %)
3. No change (identical stats)
4. Worse / worth practising (neutral descriptors, no red alarms)
5. Zero words attempted (divide-by-zero safety)
"""

import os
import shutil
import tempfile
import unittest
from pathlib import Path


class TestProgressTracking(unittest.TestCase):
    def setUp(self):
        # Create an isolated temporary directory for progress data
        self.test_dir = tempfile.mkdtemp()
        self.test_file = Path(self.test_dir) / "progress.json"
        os.environ["PROGRESS_DATA_PATH"] = str(self.test_file)

        # Import progress functions with isolated environment
        from wordbloom_agent.progress import compute_progress, save_session_summary
        self.save_session_summary = save_session_summary
        self.compute_progress = compute_progress

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)
        if "PROGRESS_DATA_PATH" in os.environ:
            del os.environ["PROGRESS_DATA_PATH"]

    def test_one_session_only(self):
        """With fewer than 2 sessions, returns not_enough_sessions without inventing baselines."""
        self.save_session_summary("emma", {
            "words_attempted": 5,
            "first_try_correct": 3,
            "hints_used": 2,
            "self_corrections": 1,
            "pattern_counts": {"reversal": 2, "blend": 1},
            "stage_at_end": 2,
        })

        result = self.compute_progress("emma")
        self.assertEqual(result.get("status"), "not_enough_sessions")
        self.assertEqual(result.get("session_count"), 1)
        self.assertIn("appears after 2 sessions", result.get("message", ""))

    def test_improvement_case(self):
        """Session 1 -> Session 2 shows clear improvement: higher first try %, fewer hints, fewer b/d reversals."""
        # Session 1
        self.save_session_summary("emma", {
            "words_attempted": 10,
            "first_try_correct": 4,  # 40%
            "hints_used": 6,         # 6 per 10 words
            "self_corrections": 2,
            "pattern_counts": {"reversal": 5, "silent_letter": 3},
            "stage_at_end": 2,
        })

        # Session 2
        self.save_session_summary("emma", {
            "words_attempted": 10,
            "first_try_correct": 7,  # 70%
            "hints_used": 2,         # 2 per 10 words
            "self_corrections": 3,
            "pattern_counts": {"reversal": 1, "silent_letter": 1},
            "stage_at_end": 3,
        })

        res = self.compute_progress("emma")
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["total_sessions"], 2)

        comp = res["comparison"]
        # First try %: 40.0% -> 70.0%
        self.assertEqual(comp["first_try_percent"]["previous"], 40.0)
        self.assertEqual(comp["first_try_percent"]["current"], 70.0)
        self.assertEqual(comp["first_try_percent"]["descriptor"], "more")

        # Hints per 10: 6.0 -> 2.0 (fewer)
        self.assertEqual(comp["hints_per_10"]["previous"], 6.0)
        self.assertEqual(comp["hints_per_10"]["current"], 2.0)
        self.assertEqual(comp["hints_per_10"]["descriptor"], "fewer")

        # Reversals: 5 -> 1 (fewer)
        reversal = comp["patterns"]["reversal"]
        self.assertEqual(reversal["previous"], 5)
        self.assertEqual(reversal["current"], 1)
        self.assertEqual(reversal["descriptor"], "fewer")

        # Stage: 2 -> 3 (advanced)
        self.assertEqual(comp["stage"]["previous"], 2)
        self.assertEqual(comp["stage"]["current"], 3)
        self.assertEqual(comp["stage"]["descriptor"], "advanced")

        # History should contain 2 sessions
        self.assertEqual(len(res["history"]), 2)
        self.assertEqual(res["history"][0]["first_try_percent"], 40.0)
        self.assertEqual(res["history"][1]["first_try_percent"], 70.0)

    def test_no_change_case(self):
        """Identical consecutive sessions should return 'same' descriptors without errors."""
        session_data = {
            "words_attempted": 6,
            "first_try_correct": 4,
            "hints_used": 2,
            "self_corrections": 1,
            "pattern_counts": {"reversal": 1, "blend": 2},
            "stage_at_end": 2,
        }
        self.save_session_summary("james", session_data)
        self.save_session_summary("james", session_data)

        res = self.compute_progress("james")
        self.assertEqual(res["status"], "ok")
        comp = res["comparison"]
        self.assertEqual(comp["first_try_percent"]["descriptor"], "same")
        self.assertEqual(comp["hints_per_10"]["descriptor"], "same")
        self.assertEqual(comp["patterns"]["reversal"]["descriptor"], "same")
        self.assertEqual(comp["stage"]["descriptor"], "steady")

    def test_worse_case_neutral_descriptors(self):
        """If metrics dipped, use neutral pedagogic phrasing ('worth practising') without red alarms."""
        # Session 1: high accuracy
        self.save_session_summary("liam", {
            "words_attempted": 8,
            "first_try_correct": 6,  # 75%
            "hints_used": 1,
            "self_corrections": 1,
            "pattern_counts": {"reversal": 0, "blend": 1},
            "stage_at_end": 3,
        })

        # Session 2: dipped accuracy and more reversals
        self.save_session_summary("liam", {
            "words_attempted": 8,
            "first_try_correct": 3,  # 37.5%
            "hints_used": 4,
            "self_corrections": 0,
            "pattern_counts": {"reversal": 3, "blend": 2},
            "stage_at_end": 3,
        })

        res = self.compute_progress("liam")
        self.assertEqual(res["status"], "ok")
        comp = res["comparison"]

        self.assertEqual(comp["first_try_percent"]["descriptor"], "worth practising")
        self.assertEqual(comp["hints_per_10"]["descriptor"], "worth practising")
        self.assertEqual(comp["patterns"]["reversal"]["descriptor"], "worth practising")

    def test_zero_words_protection(self):
        """Zero words attempted must never raise ZeroDivisionError and safely return 0.0%."""
        self.save_session_summary("alex", {
            "words_attempted": 0,
            "first_try_correct": 0,
            "hints_used": 0,
            "self_corrections": 0,
            "pattern_counts": {},
            "stage_at_end": 1,
        })
        self.save_session_summary("alex", {
            "words_attempted": 0,
            "first_try_correct": 0,
            "hints_used": 0,
            "self_corrections": 0,
            "pattern_counts": {},
            "stage_at_end": 1,
        })

        res = self.compute_progress("alex")
        self.assertEqual(res["status"], "ok")
        comp = res["comparison"]
        self.assertEqual(comp["first_try_percent"]["previous"], 0.0)
        self.assertEqual(comp["first_try_percent"]["current"], 0.0)
        self.assertEqual(comp["hints_per_10"]["previous"], 0.0)
        self.assertEqual(comp["hints_per_10"]["current"], 0.0)


if __name__ == "__main__":
    unittest.main()
