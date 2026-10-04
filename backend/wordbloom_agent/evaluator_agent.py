"""
WordBloom — evaluator_agent.py
================================
Evaluator Agent — assesses child answer quality.

Job:     Score the answer — not just right/wrong but HOW they answered
Input:   Correct word + child answer + response time + attempt number
Output:  Detailed evaluation driving adapter and encouragement agents

Runs THIRD after WordSelectorAgent.
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
def evaluate_answer(
    correct_word: str,
    child_answer: str,
    response_time_seconds: float,
    input_mode: str,
    attempt_number: int = 1,
    typical_response_time: float = 5.0,
) -> dict:
    """
    Evaluates child answer with nuance — partial credit matters.

    Args:
        correct_word:           the word that was shown
        child_answer:           what the child typed/said/tapped
        response_time_seconds:  how long they took to answer
        input_mode:             type / voice / tap
        attempt_number:         1 = first try, 2 = second try
        typical_response_time:  child's usual pace for comparison

    Returns:
        Detailed evaluation dict
    """
    letters_correct = sum(
        1 for a, b in zip(correct_word.lower(), child_answer.lower()) if a == b
    )
    is_correct = correct_word.lower().strip() == child_answer.lower().strip()

    if response_time_seconds < typical_response_time * 0.7:
        confidence = "fast"
    elif response_time_seconds < typical_response_time * 1.3:
        confidence = "normal"
    elif response_time_seconds < typical_response_time * 2.0:
        confidence = "slow"
    else:
        confidence = "very_slow"

    if is_correct:
        return {
            "is_correct": True,
            "partial_score": 1.0,
            "letters_correct": len(correct_word),
            "letters_total": len(correct_word),
            "confidence_signal": confidence,
            "error_pattern": "correct",
            "error_explanation": "Word read correctly!",
            "needs_break": False,
            "positive_observation": f"Read '{correct_word}' accurately!"
        }

    # Instant high-speed evaluation for non-exact answers (0.001s)
    partial_score = round(letters_correct / max(len(correct_word), 1), 2)
    if partial_score >= 0.5:
        pattern = "phonetic_attempt"
        explanation = f"Good phonetic effort! Identified {letters_correct} of {len(correct_word)} letters."
    elif any(c in correct_word.lower() for c in ['k', 'gh', 'w', 'b', 'l']):
        pattern = "silent_letter"
        explanation = f"Tricky silent letter pattern in '{correct_word}'."
    else:
        pattern = "omission"
        explanation = f"Attempted '{child_answer}' for '{correct_word}'."

    return {
        "is_correct": False,
        "partial_score": partial_score,
        "letters_correct": letters_correct,
        "letters_total": len(correct_word),
        "confidence_signal": confidence,
        "error_pattern": pattern,
        "error_explanation": explanation,
        "needs_break": False,
        "positive_observation": f"Stayed engaged and identified {letters_correct} letter{'s' if letters_correct != 1 else ''}!"
    }


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
evaluator_agent = Agent(
    name="EvaluatorAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Evaluates child answer quality with nuance — partial credit matters.
        Identifies specific error patterns to inform the Adapter Agent.
        Runs THIRD after WordSelectorAgent.
    """,

    instruction="""
        You are the Evaluator Agent for WordBloom.

        Your ONLY job:
        1. Receive the word, child answer and response time
        2. Call evaluate_answer() with all details
        3. Return the full evaluation dict

        CRITICAL: For dyslexic children, right/wrong is not enough.
        Always identify what they DID correctly even in a wrong answer.
        Never use negative framing in error_explanation.
        positive_observation must always find something true and good.
    """,

    tools=[evaluate_answer],
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
        return {
            "is_correct": False,
            "partial_score": 0.5,
            "letters_correct": 0,
            "letters_total": 0,
            "confidence_signal": "normal",
            "error_pattern": "unknown",
            "error_explanation": "Could not evaluate",
            "needs_break": False,
            "positive_observation": "You tried — that is what matters"
        }
