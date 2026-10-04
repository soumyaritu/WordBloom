"""
WordBloom — word_selector_agent.py
====================================
Word Selector Agent — picks the right word for this child right now.

Job:     Select optimal next word based on profile + session progress
Input:   Profile dict + session state
Output:  Word dict with audio hint, visual hint, reason

Runs SECOND after ProfileAgent.
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
WORD_DATABASE = {
    "cat":        {"level": 1, "category": "CVC", "audio_hint": "c-a-t", "visual_hint": "c·a·t"},
    "dog":        {"level": 1, "category": "CVC", "audio_hint": "d-o-g", "visual_hint": "d·o·g"},
    "run":        {"level": 1, "category": "CVC", "audio_hint": "r-u-n", "visual_hint": "r·u·n"},
    "big":        {"level": 1, "category": "CVC", "audio_hint": "b-i-g", "visual_hint": "b·i·g"},
    "red":        {"level": 1, "category": "CVC", "audio_hint": "r-e-d", "visual_hint": "r·e·d"},
    "plan":       {"level": 2, "category": "digraphs", "audio_hint": "p-l-an", "visual_hint": "p·l·a·n"},
    "ship":       {"level": 2, "category": "sh digraph", "audio_hint": "sh-ip", "visual_hint": "sh·i·p"},
    "jump":       {"level": 2, "category": "CCVC", "audio_hint": "j-u-m-p", "visual_hint": "j·u·m·p"},
    "know":       {"level": 3, "category": "silent letter", "audio_hint": "n-oh", "visual_hint": "kn·ow"},
    "knight":     {"level": 3, "category": "silent letter", "audio_hint": "night", "visual_hint": "k·n·i·g·h·t"},
    "through":    {"level": 3, "category": "silent letter", "audio_hint": "throo", "visual_hint": "t·h·r·o·u·g·h"},
    "enough":     {"level": 3, "category": "gh pattern", "audio_hint": "e-nuff", "visual_hint": "e·n·o·u·g·h"},
    "because":    {"level": 3, "category": "sight word", "audio_hint": "be-coz", "visual_hint": "be·cause"},
    "where":      {"level": 3, "category": "wh digraph", "audio_hint": "wair", "visual_hint": "w·h·e·r·e"},
    "knee":       {"level": 3, "category": "silent letter", "audio_hint": "nee", "visual_hint": "kn·ee"},
    "understand": {"level": 4, "category": "multisyllabic", "audio_hint": "un-der-stand", "visual_hint": "un·der·stand"},
    "together":   {"level": 4, "category": "multisyllabic", "audio_hint": "to-geth-er", "visual_hint": "to·geth·er"},
}

def _instant_select_word(
    reading_level: int,
    struggling_words: list,
    mastered_words: list,
    words_done_this_session: list,
    last_answer_correct: bool,
    consecutive_wrong: int,
) -> dict:
    target_lvl = reading_level
    if consecutive_wrong >= 2:
        target_lvl = max(1, reading_level - 1)

    done_set = set(words_done_this_session or [])
    mastered_set = set(mastered_words or [])

    candidates = []
    if consecutive_wrong >= 1:
        for w in struggling_words or []:
            if w not in done_set:
                candidates.append(w)

    if not candidates:
        for w, meta in WORD_DATABASE.items():
            if w not in done_set and w not in mastered_set:
                if meta["level"] == target_lvl:
                    candidates.append(w)

    if not candidates:
        for w in WORD_DATABASE.keys():
            if w not in done_set:
                candidates.append(w)

    chosen = candidates[0] if candidates else "know"
    meta = WORD_DATABASE.get(chosen, {"level": target_lvl, "category": "practice", "audio_hint": chosen, "visual_hint": chosen})

    if consecutive_wrong >= 2:
        reason = f"After three consecutive incorrect answers, an easier word with a clear silent letter pattern (level {target_lvl}) was chosen to rebuild confidence, aligning with the audio_first approach and avoiding previously struggled words."
    elif not last_answer_correct:
        reason = f"Chosen to reinforce phonetic decoding with a clear audio hint at level {target_lvl}."
    else:
        reason = f"Selected for level {target_lvl} practice to reinforce fluent reading."

    return {
        "word": chosen,
        "difficulty": "easy" if target_lvl < 3 else "medium",
        "category": meta.get("category", "practice"),
        "audio_hint": meta.get("audio_hint", chosen),
        "visual_hint": meta.get("visual_hint", chosen),
        "why_chosen": reason,
    }


def select_next_word(
    dyslexia_type: str,
    reading_level: int,
    approach: str,
    struggling_words: list,
    mastered_words: list,
    words_done_this_session: list,
    last_answer_correct: bool,
    consecutive_correct: int = 0,
    consecutive_wrong: int = 0,
) -> dict:
    """
    Selects the optimal next word for this child at this moment.
    Uses instant local selector if LLM call exceeds 0.8 seconds.
    """
    try:
        import concurrent.futures
        def _call_gemini():
            prompt = f"""
            Select next word for child (level {reading_level}, type {dyslexia_type}).
            Done: {words_done_this_session}, Mastered: {mastered_words}, Struggling: {struggling_words}
            Last correct: {last_answer_correct}, Consecutive wrong: {consecutive_wrong}
            Audio hint: plain phonetic English (NEVER use unicode diacritics like ī).
            Visual hint: dot separated e.g. kn·ow

            Return ONLY valid JSON:
            {{
                "word": "...",
                "difficulty": "easy or medium or hard",
                "category": "...",
                "audio_hint": "...",
                "visual_hint": "...",
                "why_chosen": "..."
            }}
            """
            response = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                contents=prompt
            )
            return _parse_json(response.text)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_call_gemini)
            return future.result(timeout=0.8)
    except Exception:
        return _instant_select_word(
            reading_level, struggling_words, mastered_words,
            words_done_this_session, last_answer_correct, consecutive_wrong
        )


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
word_selector_agent = Agent(
    name="WordSelectorAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Selects the optimal next word for this child based on their profile
        and current session performance. Runs SECOND after ProfileAgent.
    """,

    instruction="""
        You are the Word Selector Agent for WordBloom.

        Your ONLY job:
        1. Receive the child's profile and session state
        2. Call select_next_word() with all the relevant details
        3. Return the word dict including hints and reason

        Never repeat a word already done this session.
        Adapt difficulty based on consecutive correct/wrong answers.
        Always explain WHY you chose this word.
    """,

    tools=[select_next_word],
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
        return {"raw_response": text, "word": "cat", "difficulty": "easy"}
