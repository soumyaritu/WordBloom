"""
WordBloom — encouragement_agent.py
=====================================
Encouragement Agent — makes every child feel capable with input-aware, child-friendly praise.

Job:     Generate lively, kid-friendly encouragement tailored to their input mode (voice/tap/type)
Input:   Evaluation + profile + input_mode + session stats
Output:  Encouragement message that is specific, true, and celebratory

Runs FIFTH after EvaluatorAgent.
"""

import os
import re
import json
import random
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


def clean_spoken_text(text: str) -> str:
    """Strips emojis, pictographs, and symbols so TTS voice never announces icon names like party or rocket."""
    if not text:
        return ""
    cleaned = re.sub(r"[\U00010000-\U0010ffff]", "", text)
    cleaned = re.sub(r"[\u200d\ufe0e\ufe0f\u2600-\u27bf\u2300-\u23ff]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\s+([.,!?])", r"\1", cleaned)
    return cleaned.strip()


# ─────────────────────────────────────────────
# TOOL — Instant Local Generator (Input-Mode Aware)
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
    input_mode: str = "type",
    has_autism: bool = False,
    used_hint: bool = False,
) -> dict:
    mode = str(input_mode or "type").strip().lower()

    # Predictable, literal praise for autism profile
    if has_autism:
        if is_correct:
            action_verb = "said" if mode == "voice" else ("tapped" if mode == "tap" else "typed")
            msg = f"Correct. You {action_verb} '{word}'."
            return {
                "message_type": "celebrate",
                "message": msg,
                "spoken_message": clean_spoken_text(msg),
                "famous_dyslexic_used": None
            }
        else:
            msg = f"You found {letters_correct} of {letters_total} letters in '{word}'."
            return {
                "message_type": "reframe",
                "message": msg,
                "spoken_message": clean_spoken_text(msg),
                "famous_dyslexic_used": None
            }

    # Input-mode specific praise banks
    if is_correct:
        msg_type = "celebrate"
        if used_hint:
            hint_messages = [
                f"Brilliant decoding! 💡 You used the clue and cracked '{word}'! 🎉",
                f"Clue master! 🔍 You used the sound blocks and conquered '{word}'! 🌟",
                f"Way to persist! 🚀 You used the visual hint and decoded '{word}' perfectly!",
                f"You solved it! 💡 Looking at the letter blocks unlocked '{word}'! 🌟",
            ]
            msg = random.choice(hint_messages)
        elif session_streak >= 3:
            messages = [
                f"You're on fire! 🔥 That's {session_streak} words correct back-to-back!",
                f"Unstoppable streak! 🚀 An incredible {session_streak}-word winning streak!",
                f"Look at you go! 🌟 {session_streak} words solved back-to-back without a miss!",
                f"Garden mastery! 🌸 You've bloomed {session_streak} flowers back-to-back!",
            ]
            msg = random.choice(messages)
        elif mode == "voice":
            # Audio / Voice praise: "Great listening!"
            if letters_correct < letters_total:
                messages = [
                    f"Great listening! 👂 You caught {letters_correct} of the sounds in '{word}'!",
                    f"Super ears! 🎤 You listened closely and sounded out '{word}'!",
                    f"Great listening! You caught the trickiest sounds in '{word}'! 🌟",
                ]
            else:
                messages = [
                    f"Great listening! 👂 You caught every single sound in '{word}'! 🌟",
                    f"Super ears! 🎤 You spoke '{word}' perfectly without missing a beat!",
                    f"Great listening! You heard the sounds and nailed '{word}'! 🎉",
                ]
            msg = random.choice(messages)
        elif mode == "tap":
            # Tap letters praise: Letter blocks and tiles
            if letters_correct < letters_total:
                messages = [
                    f"Super tapping! 🔲 You hunted down {letters_correct} letters for '{word}'!",
                    f"Great tile spotting! 🧩 You built the hardest part of '{word}'!",
                    f"Awesome tapping! You found {letters_correct} letter blocks for '{word}'! 🌟",
                ]
            else:
                messages = [
                    f"Super tapping! 🔲 You built '{word}' tile by tile! 🌟",
                    f"High five! ✋ You tapped out '{word}' like a master builder!",
                    f"Great tile spotting! 🧩 You pieced together '{word}' perfectly! 🎉",
                ]
            msg = random.choice(messages)
        else:
            # Type keyboard praise: Key skills and spelling
            if letters_correct < letters_total:
                messages = [
                    f"Awesome typing! ⌨️ You caught {letters_correct} tricky keys for '{word}'!",
                    f"Fast fingers! 🚀 You typed out {letters_correct} letters of '{word}'!",
                    f"Super keyboard skills! You tackled the tricky letters in '{word}'! 🌟",
                ]
            else:
                messages = [
                    f"Awesome typing! ⌨️ You spelled out '{word}' like a pro! 🌟",
                    f"Fast fingers! 🚀 '{word}' was no match for your keyboard skills!",
                    f"Spot on! You typed every key in '{word}' perfectly! 🎉",
                ]
            msg = random.choice(messages)

    elif partial_score >= 0.7:
        msg_type = "near_miss"
        if mode == "voice":
            messages = [
                f"So close! 👂 You caught {letters_correct} sounds in '{word}' — one more try! 🌟",
                f"Nearly there! 🎤 Listen closely and let's say '{word}' together! 🚀",
            ]
        elif mode == "tap":
            messages = [
                f"So close! 🧩 You got {letters_correct} of the right tiles for '{word}' — almost there! 🌟",
                f"Nearly there! 🔲 Look at the letter blocks and tap '{word}' in order! 🚀",
            ]
        else:
            messages = [
                f"So close! ⌨️ You got {letters_correct} letters in '{word}' — nearly there! 🌟",
                f"Almost got it! 🚀 Check the letters and let's type '{word}' again! 💡",
            ]
        msg = random.choice(messages)

    else:
        msg_type = "reframe"
        if mode == "voice":
            messages = [
                f"Good try! 🎤 Take a breath, sound it out slowly, and let's say '{word}' together! 🌟",
                f"Tricky sounds! 👂 Break the sounds down and give '{word}' another go! 🚀",
                f"Nice effort! 🌟 Listening to tricky words takes practice — you can do it!",
            ]
        elif mode == "tap":
            messages = [
                f"Good try! 🧩 Take a peek at the letter blocks and tap '{word}' in order! 🌟",
                f"Nice effort! 🔲 Look at each tile and build '{word}' one step at a time! 🚀",
                f"Almost there! 💡 Check the letter blocks and give '{word}' another tap!",
            ]
        else:
            messages = [
                f"Good try! ⌨️ Take another look at the letters and let's type '{word}' again! 🌟",
                f"Tricky word! 🚀 Check the spelling for '{word}' and give it another shot — you've got this!",
                f"You're getting warmer! 💡 Take your time, look closely, and let's type '{word}' again!",
            ]
        msg = random.choice(messages)

    return {
        "message_type": msg_type,
        "message": msg,
        "spoken_message": clean_spoken_text(msg),
        "famous_dyslexic_used": None
    }


# ─────────────────────────────────────────────
# AGENT TOOL
# ─────────────────────────────────────────────
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
    input_mode: str = "type",
    used_hint: bool = False,
) -> dict:
    """
    Generates tailored encouragement matching the child's input mode (voice/tap/type).
    """
    if co_occurring is None:
        co_occurring = []
    elif isinstance(co_occurring, str):
        co_occurring = [c.strip() for c in co_occurring.split(",") if c.strip() and c.strip().lower() != "none"]

    has_adhd   = any("adhd" in str(c).lower() for c in co_occurring)
    has_autism = any("autism" in str(c).lower() for c in co_occurring)
    is_specific = encouragement_style == "specific" or has_adhd or has_autism
    mode = str(input_mode or "type").strip().lower()

    if is_correct:
        msg_type = "celebrate"
    elif partial_score >= 0.7:
        msg_type = "near_miss"
    else:
        msg_type = "reframe"

    # Instant generation tailored to input mode and neurodiversity profile (0ms latency)
    return _instant_encouragement(
        is_correct=is_correct,
        partial_score=partial_score,
        letters_correct=letters_correct,
        letters_total=letters_total,
        positive_observation=positive_observation,
        word=word,
        encouragement_style=encouragement_style,
        session_streak=session_streak,
        input_mode=mode,
        has_autism=has_autism,
        used_hint=used_hint,
    )


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
encouragement_agent = Agent(
    name="EncouragementAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Generates motivational messages tailored to child input mode (voice/tap/type).
        Runs FIFTH after EvaluatorAgent.
    """,

    instruction="""
        You are the Encouragement Agent for WordBloom.

        Your ONLY job:
        1. Receive evaluation result, word, profile, and input mode (voice/tap/type)
        2. Generate child-friendly praise tailored to how they answered:
           - Voice: "Great listening! 👂"
           - Tap: "Super tapping! 🔲"
           - Type: "Awesome typing! ⌨️"
        3. Never use generic 'good job' or adult clinical jargon
    """,

    tools=[generate_encouragement],
)


def _parse_json(text: str) -> dict:
    text = text.strip()
    fence = chr(96) * 3
    if f"{fence}json" in text:
        text = text.split(f"{fence}json")[1].split(fence)[0].strip()
    elif fence in text:
        text = text.split(fence)[1].split(fence)[0].strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict) and "spoken_message" not in data:
            data["spoken_message"] = clean_spoken_text(data.get("message", ""))
        return data
    except json.JSONDecodeError:
        fallback_msg = "Spot on! You did it! 🌟"
        return {
            "message_type": "celebrate",
            "message": fallback_msg,
            "spoken_message": clean_spoken_text(fallback_msg),
            "famous_dyslexic_used": None
        }
