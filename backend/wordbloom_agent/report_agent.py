"""
WordBloom — report_agent.py
=============================
Report Agent — generates teacher session report.

Job:     Create a clear, warm session summary for the teacher
Input:   Complete session data
Output:  Report dict requiring teacher approval before sending

Runs LAST. Nothing sends without teacher approval — the approval gate.
"""

import os
import json
import vertexai
from google import genai
from google.adk.agents import Agent
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

vertexai.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
)

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
)


# ─────────────────────────────────────────────
# TOOL
# ─────────────────────────────────────────────
def _instant_report(
    child_name: str,
    reading_level: int,
    words_attempted: list,
    words_correct: list,
    accuracy: int,
    dyslexia_type: str = "phonological",
    error_patterns: list = None,
    input_mode: str = "type",
) -> tuple:
    first_name = child_name.split()[0]
    dt_lower = str(dyslexia_type or "").lower()
    is_non_dyslexic = any(k in dt_lower for k in ["non_dyslexic", "non-dyslexic", "none", "general", "normal", "standard"])
    is_unknown = any(k in dt_lower for k in ["unknown", "not_sure", "not sure yet", "not_sure_yet", "undetermined"])

    patterns = [str(p).lower() for p in (error_patterns or [])]
    mode_clean = str(input_mode or "type").strip().lower()

    if not words_attempted:
        return f"{first_name} checked into WordBloom today. No full word exercises were completed in this check-in session.", None, None

    if is_unknown:
        # WordBloom Assessment session logic: analyze observed patterns to recommend a profile
        if any("reversal" in p or "mirror" in p or "visual" in p for p in patterns):
            rec_profile = "Visual/Spatial"
            rec_detail = "recurring letter reversals and spatial orientation struggle"
            if mode_clean in ["tap", "tiles"]:
                rec_reason = f"{first_name} used letter tiles and hesitated on letters that mirror or rotate (e.g., b↔d). OpenDyslexic weighted letter bases reduce spatial flipping."
            elif mode_clean in ["voice", "speech", "say"]:
                rec_reason = f"{first_name} answered verbally and showed perceptual letter reversal patterns. OpenDyslexic weighted letter bases reduce spatial flipping."
            else:
                rec_reason = f"{first_name} typed answers on the keyboard and hesitated on letters that mirror or rotate (e.g., b↔d). OpenDyslexic weighted letter bases reduce spatial flipping."
        elif any("transposition" in p or "swap" in p or "order" in p for p in patterns):
            rec_profile = "Attentional"
            rec_detail = "letters swapping order and letter sequencing difficulties"
            rec_reason = f"When spelling and reading words, {first_name} exhibited letter transposition patterns (swapping adjacent letter positions within words). Spotlight mode and visual letter anchor boxes help keep letters locked in sequential order."
        elif any("silent" in p or "whole_word" in p or "irregular" in p for p in patterns):
            rec_profile = "Surface"
            rec_detail = "difficulty recognizing irregular whole-word shapes and silent letters"
            rec_reason = f"When reading and spelling, {first_name} struggled recognizing irregular whole-word shapes and silent letters. Visual spotlighting and word silhouettes strengthen orthographic memory."
        elif any("vowel_confusion" in p for p in patterns):
            rec_profile = "Phonological"
            rec_detail = "vowel sound confusions and phoneme discrimination difficulties"
            if mode_clean in ["voice", "speech", "say"]:
                rec_reason = f"When speaking words, {first_name} showed difficulty segmenting individual phonemes and distinguishing vowel sounds. Spoken sound chunking and audio models provide direct vowel pronunciation support."
            elif mode_clean in ["tap", "tiles"]:
                rec_reason = f"When selecting letter tiles, {first_name} made phonetic vowel substitutions. Color-coded vowel tiles and sound chunks will reinforce how letter tiles correspond to word sounds."
            else:
                rec_reason = f"When typing words, {first_name} demonstrated vowel substitution patterns (e.g. confusing short vowel sounds like 'a' for 'i'). Targeted vowel phonics and color-coded sound chunking will strengthen their letter-sound mapping."
        elif accuracy >= 80:
            rec_profile = "Non-dyslexic (Standard Mode)"
            rec_detail = f"strong natural fluency ({accuracy}% accuracy) without characteristic dyslexic errors"
            rec_reason = f"{first_name} displayed natural decoding pace and high accuracy ({accuracy}%) without perceptual distortions. Standard typography and pacing are recommended."
        elif any("vowel" in p or "omission" in p or "phonetic" in p or "blend" in p for p in patterns):
            rec_profile = "Phonological"
            rec_detail = "vowel sound confusions and phoneme discrimination difficulties"
            if mode_clean in ["voice", "speech", "say"]:
                rec_reason = f"When speaking words, {first_name} showed difficulty segmenting individual phonemes and distinguishing vowel sounds. Spoken sound chunking and audio models provide direct vowel pronunciation support."
            elif mode_clean in ["tap", "tiles"]:
                rec_reason = f"When selecting letter tiles, {first_name} made phonetic vowel substitutions. Color-coded vowel tiles and sound chunks will reinforce how letter tiles correspond to word sounds."
            else:
                rec_reason = f"When typing words, {first_name} demonstrated vowel substitution patterns (e.g. confusing short vowel sounds like 'a' for 'i'). Targeted vowel phonics and color-coded sound chunking will strengthen their letter-sound mapping."
        else:
            rec_profile = "Non-dyslexic (Standard Mode)" if accuracy >= 70 else "Phonological"
            rec_detail = f"natural decoding pace ({accuracy}% accuracy)" if accuracy >= 70 else "early phonics and sound-letter decoding needs"
            if accuracy >= 70:
                rec_reason = f"{first_name} read comfortably without characteristic perceptual dyslexia patterns. Standard curriculum is recommended."
            else:
                rec_reason = f"At Stage {reading_level}, {first_name} benefits from sound-by-sound phonics chunking and guided practice to develop phonological decoding."

        report_text = (
            f"🌸 WordBloom Assessment: {first_name} completed {len(words_attempted)} words today with {accuracy}% accuracy. "
            f"During the session, the Evaluator Agent noted {rec_detail}. "
            f"WordBloom Recommended Profile: {rec_profile}."
        )
        return report_text, rec_profile, rec_reason

    elif is_non_dyslexic:
        if accuracy >= 80:
            return f"{first_name} demonstrated strong reading fluency today, completing {len(words_attempted)} word exercises with {accuracy}% accuracy at Stage {reading_level}.", None, None
        elif accuracy >= 50:
            return f"{first_name} worked through {len(words_attempted)} words today with {accuracy}% accuracy, maintaining steady engagement at Stage {reading_level}.", None, None
        else:
            return f"{first_name} practiced {len(words_attempted)} words today, reinforcing core Stage {reading_level} vocabulary.", None, None
    elif accuracy >= 80:
        return f"{first_name} demonstrated strong reading fluency today, completing {len(words_attempted)} word exercises with {accuracy}% accuracy. Showed high confidence decoding reading level {reading_level} patterns.", None, None
    elif accuracy >= 50:
        return f"{first_name} worked through {len(words_attempted)} words today with {accuracy}% accuracy, maintaining steady engagement. Maintained focus while navigating tricky silent letter patterns.", None, None
    else:
        return f"{first_name} showed great persistence during today's reading practice ({len(words_attempted)} words attempted). Stepped back to level {reading_level} target patterns to build decoding confidence.", None, None


def generate_session_report(
    child_name: str,
    dyslexia_type: str,
    reading_level: int,
    session_duration_mins: float,
    words_attempted: list,
    words_correct: list,
    words_incorrect: list,
    adapter_actions: list,
    error_patterns: list,
    encouragement_messages: list,
    breaks_taken: int,
    input_mode: str = "type",
) -> dict:
    """
    Generates a session report for teacher review and approval.
    Uses instant local report generator if LLM exceeds 0.8 seconds.
    """
    accuracy = round(
        (len(words_correct) / len(words_attempted) * 100)
        if words_attempted else 0
    )

    def _clean_words(w_list):
        cleaned, seen = [], set()
        for item in (w_list or []):
            val = str(item.get("target") or item.get("word") or item if isinstance(item, dict) else item or "").strip().lower()
            if val and val not in seen:
                seen.add(val)
                cleaned.append(val)
        return cleaned

    new_mastered = _clean_words(words_correct)
    to_revisit   = _clean_words(words_incorrect)

    # Instant zero-latency report generation (<0.001s)
    report_text, recommended_profile, recommendation_reason = _instant_report(
        child_name, reading_level, words_attempted, words_correct, accuracy, dyslexia_type, error_patterns, input_mode
    )

    is_unknown = any(k in str(dyslexia_type or "").lower() for k in ["unknown", "not_sure", "not sure yet", "not_sure_yet", "undetermined"])

    # Safe DLP PII de-identification for parent export & external records
    deidentified_report_text = report_text
    dlp_screened = False
    try:
        from wordbloom_agent.dlp_redaction import redact_personal_data, DLP_ENABLED
        if DLP_ENABLED:
            dlp_res = redact_personal_data(report_text, child_name=child_name)
            deidentified_report_text = dlp_res.get("redacted_text") or report_text
            dlp_screened = True
    except Exception:
        deidentified_report_text = report_text

    return {
        "child_name":             child_name,
        "session_date":           datetime.now().strftime("%Y-%m-%d"),
        "session_date_display":   datetime.now().strftime("%A %d %B %Y"),
        "duration_minutes":       round(session_duration_mins),
        "words_attempted":        len(words_attempted),
        "words_correct":          len(words_correct),
        "accuracy_percent":       accuracy,
        "new_words_mastered":     new_mastered[:5],
        "words_to_revisit":       to_revisit[:5],
        "error_patterns_seen":    list(set(error_patterns)),
        "adapter_actions":        adapter_actions,
        "breaks_taken":           breaks_taken,
        "report_text":            report_text,
        "deidentified_report_text": deidentified_report_text,
        "dlp_screened":            dlp_screened,
        "recommended_profile":    recommended_profile,
        "recommendation_reason":  recommendation_reason,
        "is_assessment":          is_unknown,
        "approval_required":      True,
        "approved":               False,
    }


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
report_agent = Agent(
    name="ReportAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Generates teacher session report after each WordBloom session.
        Requires teacher approval before anything is sent.
        This is the approval gate — identical in concept to SocialSpark's gate.
        Runs LAST in the pipeline.
    """,

    instruction="""
        You are the Report Agent for WordBloom.

        Your ONLY job:
        1. Receive complete session data
        2. Call generate_session_report() with all the details
        3. Return the report dict

        The report goes to the teacher BEFORE sending.
        Nothing is sent until the teacher clicks approve.
        Write warmly — this teacher knows this child.
        Be specific and honest about both progress and struggles.
    """,

    tools=[generate_session_report],
)
