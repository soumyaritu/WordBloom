"""
WordBloom — test_offline_suite.py
==================================
30 Comprehensive Offline Deterministic Unit Tests.
Zero LLM calls, zero network dependencies, runs in < 0.5s.

Covers:
  Tests 1-5:   Dyslexia typology base thresholds (Phonological, Surface, Visual, Double Deficit, Non-dyslexic)
  Tests 6-8:   Input method adjustments (Voice -0.12, Tap -0.08, Type 0.00)
  Tests 9-12:  Reading stage adjustments (Stage 1 to 4)
  Tests 13-15: Co-occurring conditions (ADHD -0.05, Dyspraxia -0.03, Autism 0.00)
  Tests 16-18: Mirror reversal detection & Scaffolded Retry (b/d, p/q, n/u)
  Tests 19-21: Adjacent letter transposition / anagram detection
  Tests 22-24: Interior vowel confusion detection
  Tests 25-27: 200+ term phonetic map lookups (silent letters, vowel teams, clipping)
  Tests 28-30: Boundary conditions & latency signals (zero words, empty inputs, fast/slow pace)
"""

import unittest
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent))

from wordbloom_agent.evaluator_agent import (
    get_candy_threshold,
    evaluate_answer,
    _is_vowel_confusion,
    _is_transposition,
    DYSLEXIC_MIRRORS,
)
from wordbloom_agent.phonetic_map import (
    EXPANDED_VOICE_HOMOPHONES,
    EXPANDED_SILENT_VARIANTS,
    is_acoustic_match,
    get_acoustic_variants,
)
from wordbloom_agent.progress import (
    compute_progress,
    save_session_summary,
)


class TestWordBloomOfflineSuite(unittest.TestCase):

    # ─────────────────────────────────────────────
    # TESTS 1-5: DYSLEXIA BASE THRESHOLDS
    # ─────────────────────────────────────────────
    def test_01_phonological_threshold(self):
        th = get_candy_threshold("phonological", "type", 2, [])
        self.assertEqual(th, 0.75)

    def test_02_surface_threshold(self):
        th = get_candy_threshold("surface", "type", 2, [])
        self.assertEqual(th, 0.65)

    def test_03_visual_spatial_threshold(self):
        th = get_candy_threshold("visual_spatial", "type", 2, [])
        self.assertEqual(th, 0.70)

    def test_04_double_deficit_threshold(self):
        th = get_candy_threshold("double_deficit", "type", 2, [])
        self.assertEqual(th, 0.60)

    def test_05_nondyslexic_exact_threshold(self):
        th = get_candy_threshold("non_dyslexic", "type", 2, [])
        self.assertEqual(th, 1.00)

    # ─────────────────────────────────────────────
    # TESTS 6-8: INPUT METHOD ADJUSTMENTS
    # ─────────────────────────────────────────────
    def test_06_voice_input_adjustment(self):
        # Base 0.75 - 0.12 = 0.63
        th = get_candy_threshold("phonological", "voice", 2, [])
        self.assertEqual(th, 0.63)

    def test_07_tap_input_adjustment(self):
        # Base 0.70 - 0.08 = 0.62
        th = get_candy_threshold("visual_spatial", "tap", 2, [])
        self.assertEqual(th, 0.62)

    def test_08_type_input_baseline(self):
        # Base 0.65 + 0.00 = 0.65
        th = get_candy_threshold("surface", "type", 2, [])
        self.assertEqual(th, 0.65)

    # ─────────────────────────────────────────────
    # TESTS 9-12: READING STAGE ADJUSTMENTS
    # ─────────────────────────────────────────────
    def test_09_stage_1_cvc_adjustment(self):
        # Base 0.75 + 0.05 = 0.80
        th = get_candy_threshold("phonological", "type", 1, [])
        self.assertEqual(th, 0.80)

    def test_10_stage_2_blend_baseline(self):
        th = get_candy_threshold("phonological", "type", 2, [])
        self.assertEqual(th, 0.75)

    def test_11_stage_3_silent_adjustment(self):
        # Base 0.75 - 0.05 = 0.70
        th = get_candy_threshold("phonological", "type", 3, [])
        self.assertEqual(th, 0.70)

    def test_12_stage_4_multisyllabic_adjustment(self):
        # Base 0.75 - 0.08 = 0.67
        th = get_candy_threshold("phonological", "type", 4, [])
        self.assertEqual(th, 0.67)

    # ─────────────────────────────────────────────
    # TESTS 13-15: CO-OCCURRING CONDITIONS
    # ─────────────────────────────────────────────
    def test_13_adhd_attention_adjustment(self):
        # Base 0.75 - 0.05 = 0.70
        th = get_candy_threshold("phonological", "type", 2, ["ADHD"])
        self.assertEqual(th, 0.70)

    def test_14_autism_predictable_scoring(self):
        # Base 0.75 + 0.00 = 0.75 (predictability)
        th = get_candy_threshold("phonological", "type", 2, ["Autism"])
        self.assertEqual(th, 0.75)

    def test_15_dyspraxia_fine_motor_adjustment(self):
        # Base 0.70 - 0.03 = 0.67
        th = get_candy_threshold("visual_spatial", "type", 2, ["Dyspraxia"])
        self.assertEqual(th, 0.67)

    # ─────────────────────────────────────────────
    # TESTS 16-18: MIRROR REVERSAL & SCAFFOLDED RETRY
    # ─────────────────────────────────────────────
    def test_16_mirror_reversal_detection_b_d(self):
        # 'bog' for 'dog': reversal pattern, correct must be False to trigger Scaffolded Retry
        res = evaluate_answer("dog", "bog", 3.0, input_mode="type", dyslexia_type="visual_spatial")
        self.assertFalse(res["is_correct"])
        self.assertEqual(res["error_pattern"], "reversal")
        self.assertTrue(res["needs_visual_hint"])

    def test_17_mirror_reversal_detection_p_q(self):
        # 'quad' for 'puad'
        res = evaluate_answer("pin", "qin", 3.0, input_mode="type", dyslexia_type="visual_spatial")
        self.assertEqual(res["error_pattern"], "reversal")

    def test_18_mirror_reversal_scaffolded_retry_persists(self):
        # On attempt 1 with reversal, child earns retry hint, not red penalty
        res = evaluate_answer("dog", "bog", 2.5, attempt_number=1, dyslexia_type="visual_spatial")
        self.assertEqual(res["error_pattern"], "reversal")
        self.assertIn("visual hint", res["error_explanation"])

    # ─────────────────────────────────────────────
    # TESTS 19-21: TRANSPOSITION / ANAGRAM DETECTION
    # ─────────────────────────────────────────────
    def test_19_transposition_adjacent_letters(self):
        self.assertTrue(_is_transposition("dip", "dpi"))
        self.assertTrue(_is_transposition("chair", "cahir"))

    def test_20_transposition_evaluator_flag(self):
        res = evaluate_answer("chair", "cahir", 3.0, input_mode="type", dyslexia_type="visual_spatial")
        self.assertEqual(res["error_pattern"], "transposition")

    def test_21_transposition_non_match(self):
        # Different letters is not a transposition
        self.assertFalse(_is_transposition("dog", "cat"))

    # ─────────────────────────────────────────────
    # TESTS 22-24: INTERIOR VOWEL CONFUSION
    # ─────────────────────────────────────────────
    def test_22_vowel_confusion_detection(self):
        self.assertTrue(_is_vowel_confusion("dog", "dug"))
        self.assertTrue(_is_vowel_confusion("bad", "bed"))
        self.assertTrue(_is_vowel_confusion("pin", "pen"))

    def test_23_vowel_confusion_evaluator_flag(self):
        res = evaluate_answer("dog", "dug", 2.0, input_mode="type", dyslexia_type="phonological")
        self.assertEqual(res["error_pattern"], "vowel_confusion")

    def test_24_consonant_change_is_not_vowel_confusion(self):
        self.assertFalse(_is_vowel_confusion("dog", "fog"))

    # ─────────────────────────────────────────────
    # TESTS 25-27: 200+ TERM PHONETIC MAP LOOKUPS
    # ─────────────────────────────────────────────
    def test_25_pediatric_voice_clipping_gnome_to_no(self):
        # Spoken 'gnome' clipped to 'no' recognized as voice match
        res = evaluate_answer("gnome", "no", 2.0, input_mode="voice", dyslexia_type="phonological")
        self.assertTrue(res["is_correct"])
        self.assertEqual(res["error_pattern"], "voice_match")

    def test_26_silent_letter_phonetic_variant_lookup(self):
        # 'knight' -> 'nite', 'island' -> 'iland', 'thumb' -> 'thum'
        self.assertTrue(is_acoustic_match("knight", "nite"))
        self.assertTrue(is_acoustic_match("island", "iland"))
        self.assertTrue(is_acoustic_match("thumb", "thum"))

    def test_27_vowel_team_homophone_lookup(self):
        # 'meat' -> 'meet', 'stair' -> 'stare', 'flour' -> 'flower'
        self.assertTrue(is_acoustic_match("meat", "meet"))
        self.assertTrue(is_acoustic_match("stair", "stare"))
        self.assertTrue(is_acoustic_match("flour", "flower"))

    # ─────────────────────────────────────────────
    # TESTS 28-30: BOUNDARY CONDITIONS & LATENCY
    # ─────────────────────────────────────────────
    def test_28_zero_words_progress_safe(self):
        # Zero words attempted must return clean empty dict without ZeroDivisionError
        summary = save_session_summary("zero_child", {"words": []})
        self.assertEqual(summary["words_attempted"], 0)
        self.assertEqual(summary["first_try_correct"], 0)

    def test_29_empty_input_handling(self):
        res = evaluate_answer("sun", "", 1.0, input_mode="type")
        self.assertFalse(res["is_correct"])
        self.assertFalse(res["correct"])

    def test_30_confidence_latency_signals(self):
        # Fast latency (< 0.7x typical)
        res_fast = evaluate_answer("cat", "cat", response_time_seconds=2.0, typical_response_time=5.0)
        self.assertEqual(res_fast["confidence_signal"], "fast")

        # Slow latency (> 2.0x typical)
        res_slow = evaluate_answer("cat", "cat", response_time_seconds=11.0, typical_response_time=5.0)
        self.assertEqual(res_slow["confidence_signal"], "very_slow")


if __name__ == "__main__":
    unittest.main()
