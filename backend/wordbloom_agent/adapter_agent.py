"""
WordBloom — adapter_agent.py
==============================
Adapter Agent — decides what happens next based on performance.

Job:     The intelligence that makes WordBloom truly adaptive
Input:   Evaluation + profile + session stats
Output:  Next action (continue/easier/harder/break/end)

Runs FOURTH after EvaluatorAgent.
"""

import os
import json
import vertexai
from google import genai
from google.adk.agents import Agent
from dotenv import load_dotenv

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
def decide_adaptation(
    is_correct: bool,
    partial_score: float,
    confidence_signal: str,
    needs_break: bool,
    error_pattern: str,
    dyslexia_type: str,
    co_occurring: list,
    words_done: int,
    break_after: int,
    session_length_mins: int,
    time_elapsed_mins: float,
    consecutive_correct: int,
    consecutive_wrong: int,
    current_level: int,
) -> dict:
    """
    Decides what happens next in the session.

    Args:
        is_correct:          was the answer correct
        partial_score:       0-1 score for partial credit
        confidence_signal:   fast/normal/slow/very_slow
        needs_break:         evaluator flagged a break needed
        error_pattern:       type of error made
        dyslexia_type:       child's dyslexia type
        co_occurring:        list of co-occurring conditions
        words_done:          how many words done this session
        break_after:         profile setting for break frequency
        session_length_mins: max session length from profile
        time_elapsed_mins:   how long session has been running
        consecutive_correct: how many correct in a row
        consecutive_wrong:   how many wrong in a row
        current_level:       current reading level 1-4

    Returns:
        Adaptation action dict
    """
    has_adhd   = "adhd"     in [c.lower() for c in co_occurring]
    has_autism = "autism"   in [c.lower() for c in co_occurring]
    is_double  = dyslexia_type == "double"

    # Only offer a break after a successful word, never during wrong answer struggle
    force_break = (
        is_correct and words_done >= break_after and (words_done % break_after == 0)
    )

    session_over = time_elapsed_mins >= session_length_mins

    if session_over:
        action = "end_session"
        reason = f"Session time of {session_length_mins} minutes reached"
    elif consecutive_wrong >= 2:
        action = "make_easier"
        reason = f"{consecutive_wrong} wrong in a row — stepping back to build confidence"
    elif force_break:
        action = "take_break"
        reason = "Break time — rest your eyes and stretch" if has_adhd else "Great work! Time for a short break"
    elif consecutive_correct >= 3 and not is_double:
        action = "make_harder"
        reason = f"{consecutive_correct} correct in a row — ready for more challenge"
    else:
        action = "continue"
        reason = "Good steady progress — maintaining current level"

    level_change = 0
    if action == "make_harder" and current_level < 4:
        level_change = 1
    elif action == "make_easier" and current_level > 1:
        level_change = -1

    approach_change = None
    if error_pattern == "silent_letter" and dyslexia_type == "phonological":
        approach_change = "Focus next word on phonetic chunking to highlight the silent part"

    return {
        "action":          action,
        "level_change":    level_change,
        "approach_change": approach_change,
        "break_duration_seconds": 30 if action == "take_break" else 0,
        "reason":          reason,
        "session_over":    action == "end_session",
    }


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
adapter_agent = Agent(
    name="AdapterAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Decides the next action based on child performance and profile.
        The intelligence that keeps each child in their learning zone.
        Runs FOURTH after EvaluatorAgent.
    """,

    instruction="""
        You are the Adapter Agent for WordBloom.

        Your ONLY job:
        1. Receive evaluation results and session state
        2. Call decide_adaptation() with all relevant data
        3. Return the adaptation action

        CRITICAL profile rules:
        - ADHD: always enforce breaks at break_after threshold — no exceptions
        - Double deficit: never increase pace, never add time pressure
        - Autism: gradual changes only — no sudden difficulty jumps
        - Dyspraxia: input_mode changes must be smooth, no sudden switches

        Goal: keep the child in the learning zone —
        not so easy they are bored,
        not so hard they are frustrated.
    """,

    tools=[decide_adaptation],
)


def _parse_json(text: str) -> dict:
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"action": "continue", "level_change": 0, "reason": "continuing"}
