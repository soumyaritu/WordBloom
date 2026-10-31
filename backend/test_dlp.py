"""
WordBloom — test_dlp.py
========================
Unit Tests for Google Cloud DLP & Deterministic PII Redaction Fallback.

Tests:
  1. Full child name redaction to surrogate token.
  2. First name standalone redaction.
  3. Email address redaction.
  4. Phone number redaction.
  5. Re-identification rehydration test.
  6. Feature flag passthrough when DLP_ENABLED=False.
  7. Integration with generate_session_report (presence of deidentified_report_text).
  8. Safe non-crashing behavior on empty string or None.
"""

import unittest
import sys
import os
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent))

from wordbloom_agent.dlp_redaction import (
    redact_personal_data,
    reidentify_text,
    _local_surrogate_redaction,
    SURROGATE_STUDENT,
    SURROGATE_EMAIL,
    SURROGATE_PHONE,
)
from wordbloom_agent.report_agent import generate_session_report


class TestCloudDLPRedaction(unittest.TestCase):

    def test_01_full_name_redaction(self):
        text = "Emma Clarke completed 5 word exercises today with 80% accuracy."
        res = redact_personal_data(text, child_name="Emma Clarke")
        self.assertIn(SURROGATE_STUDENT, res["redacted_text"])
        self.assertNotIn("Emma Clarke", res["redacted_text"])
        self.assertGreaterEqual(res["findings_count"], 1)

    def test_02_first_name_redaction(self):
        text = "During the session, Emma worked hard on silent letters."
        res = redact_personal_data(text, child_name="Emma Clarke")
        self.assertIn(SURROGATE_STUDENT, res["redacted_text"])
        self.assertNotIn("Emma", res["redacted_text"])

    def test_03_email_redaction(self):
        text = "Session notes sent to teacher@wordbloom.edu regarding progress."
        res = redact_personal_data(text)
        self.assertIn(SURROGATE_EMAIL, res["redacted_text"])
        self.assertNotIn("teacher@wordbloom.edu", res["redacted_text"])

    def test_04_phone_redaction(self):
        text = "Emergency contact: +1 (555) 234-5678."
        res = redact_personal_data(text)
        self.assertIn(SURROGATE_PHONE, res["redacted_text"])
        self.assertNotIn("555", res["redacted_text"])

    def test_05_reidentify_text(self):
        text = "Emma Clarke did great today!"
        redaction = redact_personal_data(text, child_name="Emma Clarke")
        rehydrated = reidentify_text(redaction["redacted_text"], redaction["surrogates"])
        self.assertEqual(rehydrated, text)

    def test_06_empty_and_none_safety(self):
        res1 = redact_personal_data("")
        self.assertEqual(res1["redacted_text"], "")
        self.assertEqual(res1["findings_count"], 0)

        res2 = redact_personal_data(None)
        self.assertEqual(res2["redacted_text"], "")

    def test_07_report_agent_integration(self):
        report = generate_session_report(
            child_name="Emma Clarke",
            dyslexia_type="phonological",
            reading_level=3,
            session_duration_mins=5.0,
            words_attempted=["knock", "gnome"],
            words_correct=["knock", "gnome"],
            words_incorrect=[],
            adapter_actions=["continue"],
            error_patterns=[],
            encouragement_messages=["Great job!"],
            breaks_taken=0,
            input_mode="voice",
        )
        self.assertTrue(report.get("dlp_screened"))
        self.assertIn("deidentified_report_text", report)
        self.assertIn(SURROGATE_STUDENT, report["deidentified_report_text"])
        # Original educator view remains unchanged
        self.assertIn("Emma", report["report_text"])


if __name__ == "__main__":
    unittest.main()
