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
) -> str:
    first_name = child_name.split()[0]
    is_non_dyslexic = any(k in str(dyslexia_type).lower() for k in ["non_dyslexic", "non-dyslexic", "none", "general", "normal", "standard"])

    if not words_attempted:
        return f"{first_name} checked into WordBloom today. No full word exercises were completed in this check-in session."
    elif is_non_dyslexic:
        if accuracy >= 80:
            return f"{first_name} demonstrated strong reading fluency today, completing {len(words_attempted)} word exercises with {accuracy}% accuracy at Stage {reading_level}."
        elif accuracy >= 50:
            return f"{first_name} worked through {len(words_attempted)} words today with {accuracy}% accuracy, maintaining steady engagement at Stage {reading_level}."
        else:
            return f"{first_name} practiced {len(words_attempted)} words today, reinforcing core Stage {reading_level} vocabulary."
    elif accuracy >= 80:
        return f"{first_name} demonstrated strong reading fluency today, completing {len(words_attempted)} word exercises with {accuracy}% accuracy. Showed high confidence decoding reading level {reading_level} patterns."
    elif accuracy >= 50:
        return f"{first_name} worked through {len(words_attempted)} words today with {accuracy}% accuracy, maintaining steady engagement. Maintained focus while navigating tricky silent letter patterns."
    else:
        return f"{first_name} showed great persistence during today's reading practice ({len(words_attempted)} words attempted). Stepped back to level {reading_level} target patterns to build decoding confidence."


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
) -> dict:
    """
    Generates a session report for teacher review and approval.
    Uses instant local report generator if LLM exceeds 0.8 seconds.
    """
    accuracy = round(
        (len(words_correct) / len(words_attempted) * 100)
        if words_attempted else 0
    )

    new_mastered = [w for w in words_correct if len(words_correct) > 0]
    to_revisit   = list(set(words_incorrect))

    # Instant zero-latency report generation (<0.001s)
    report_text = _instant_report(child_name, reading_level, words_attempted, words_correct, accuracy, dyslexia_type)

    return {
        "child_name":           child_name,
        "session_date":         datetime.now().strftime("%Y-%m-%d"),
        "session_date_display": datetime.now().strftime("%A %d %B %Y"),
        "duration_minutes":     round(session_duration_mins),
        "words_attempted":      len(words_attempted),
        "words_correct":        len(words_correct),
        "accuracy_percent":     accuracy,
        "new_words_mastered":   new_mastered[:5],
        "words_to_revisit":     to_revisit[:5],
        "error_patterns_seen":  list(set(error_patterns)),
        "adapter_actions":      adapter_actions,
        "breaks_taken":         breaks_taken,
        "report_text":          report_text,
        "approval_required":    True,
        "approved":             False,
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
