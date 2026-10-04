"""
WordBloom — encouragement_agent.py
=====================================
Encouragement Agent — makes every child feel capable.

Job:     Generate the right motivational message for this child right now
Input:   Evaluation + profile + session stats
Output:  Encouragement message that is specific, true, and powerful

Runs FIFTH after EvaluatorAgent.
"""

import os
import json
import vertexai
from pathlib import Path
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

SKILLS_DIR = Path(__file__).parent / "skills"


# ─────────────────────────────────────────────
# TOOL
# ─────────────────────────────────────────────
def _instant_encouragement(
    is_correct: bool,
    partial_score: float,
    letters_correct: int,
    letters_total: int,
    positive_observation: str,
    word: str,
    encouragement_style: str,
    session_streak: int,
) -> dict:
    if is_correct:
        msg_type = "celebrate"
        if session_streak >= 3:
            msg = f"Outstanding! You read '{word}' perfectly — that's {session_streak} correct in a row!"
        elif letters_total >= 5:
            msg = f"Excellent reading! You accurately decoded all {letters_total} letters in '{word}'."
        else:
            msg = f"Spot on! You read '{word}' accurately."
    elif partial_score >= 0.7:
        msg_type = "near_miss"
        msg = f"Great phonetic attempt! You correctly identified {letters_correct} of {letters_total} letters in '{word}'."
    else:
        msg_type = "reframe"
        if letters_correct > 0:
            msg = f"You correctly identified {letters_correct} of {letters_total} letter{'s' if letters_correct != 1 else ''} in '{word}'."
        else:
            msg = f"You stayed focused and attempted '{word}'. Tricky silent patterns take practice — Albert Einstein also found them tricky!"

    return {
        "message_type": msg_type,
        "message": msg,
        "famous_dyslexic_used": "Albert Einstein" if "Einstein" in msg else None
    }


def generate_encouragement(
    is_correct: bool,
    partial_score: float,
    letters_correct: int,
    letters_total: int,
    positive_observation: str,
    word: str,
    encouragement_style: str,
    co_occurring: list,
    words_done_today: int,
    words_correct_today: int,
    session_streak: int,
) -> dict:
    """
    Generates the right encouragement message for this child right now.
    Uses instant local generator if LLM exceeds 0.8 seconds.
    """
    has_adhd   = "adhd"   in [c.lower() for c in co_occurring]
    has_autism = "autism" in [c.lower() for c in co_occurring]
    is_specific = encouragement_style == "specific" or has_adhd or has_autism

    if is_correct:
        msg_type = "celebrate"
    elif partial_score >= 0.7:
        msg_type = "near_miss"
    else:
        msg_type = "reframe"

    # Fast-path for non-correct or quick response requirement
    try:
        import concurrent.futures
        def _call_gemini():
            prompt = f"""
            Generate one brief encouragement message for a child after attempting the word "{word}".
            Result: Correct={is_correct}, Score={partial_score:.1f}, Letters={letters_correct}/{letters_total}
            Style: {"specific factual max 1 sentence" if is_specific else "warm max 2 sentences"}
            Message type: {msg_type}

            NEVER say: "Good try", "Almost!", "Keep trying"
            ALWAYS say something TRUE and SPECIFIC.

            Return ONLY valid JSON:
            {{
                "message_type": "{msg_type}",
                "message": "Your message here",
                "famous_dyslexic_used": null
            }}
            """
            res = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                contents=prompt
            )
            return _parse_json(res.text)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_call_gemini)
            return future.result(timeout=0.8)
    except Exception:
        return _instant_encouragement(
            is_correct, partial_score, letters_correct, letters_total,
            positive_observation, word, encouragement_style, session_streak
        )


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
encouragement_agent = Agent(
    name="EncouragementAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Generates encouragement messages that make every child feel capable.
        Adapts style based on profile — specific for ADHD/Autism, warm for others.
        Runs FIFTH after EvaluatorAgent.
    """,

    instruction="""
        You are the Encouragement Agent for WordBloom.

        Your ONLY job:
        1. Receive evaluation results and child profile settings
        2. Call generate_encouragement() with all the details
        3. Return the message dict

        The child reads your words. Make them feel capable — not pitied.

        For ADHD and Autism profiles: specific and factual only.
        For standard profiles: warm, specific, and true.
        Never generic. Never vague. Always true.
    """,

    tools=[generate_encouragement],
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
            "message_type": "celebrate",
            "message": "You are doing great — keep going.",
            "famous_dyslexic_used": None
        }
