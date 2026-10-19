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
from google.genai import types
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
# STAGE-AWARE EMERGENCY FALLBACK (ONLY IF OFFLINE)
# ─────────────────────────────────────────────
STAGE_FALLBACKS = {
    1: [
        {"word": "sun",  "difficulty": "easy", "category": "CVC", "audio_hint": "sun",  "visual_hint": "s·u·n",  "sentence": "The warm sun is shining bright."},
        {"word": "hop",  "difficulty": "easy", "category": "CVC", "audio_hint": "hop",  "visual_hint": "h·o·p",  "sentence": "Watch the little bunny hop."},
        {"word": "bat",  "difficulty": "easy", "category": "CVC", "audio_hint": "bat",  "visual_hint": "b·a·t",  "sentence": "He swung the wooden bat."},
        {"word": "cup",  "difficulty": "easy", "category": "CVC", "audio_hint": "cup",  "visual_hint": "c·u·p",  "sentence": "Drink water from the blue cup."},
        {"word": "pin",  "difficulty": "easy", "category": "CVC", "audio_hint": "pin",  "visual_hint": "p·i·n",  "sentence": "Fasten the paper with a pin."},
        {"word": "net",  "difficulty": "easy", "category": "CVC", "audio_hint": "net",  "visual_hint": "n·e·t",  "sentence": "The butterfly landed on the net."},
        {"word": "fog",  "difficulty": "easy", "category": "CVC", "audio_hint": "fog",  "visual_hint": "f·o·g",  "sentence": "Thick white fog covered the hill."},
        {"word": "map",  "difficulty": "easy", "category": "CVC", "audio_hint": "map",  "visual_hint": "m·a·p",  "sentence": "We followed the treasure map."},
        {"word": "red",  "difficulty": "easy", "category": "CVC", "audio_hint": "red",  "visual_hint": "r·e·d",  "sentence": "The red apple fell from the tree."},
        {"word": "big",  "difficulty": "easy", "category": "CVC", "audio_hint": "big",  "visual_hint": "b·i·g",  "sentence": "Look at that big friendly dog."},
        {"word": "fox",  "difficulty": "easy", "category": "CVC", "audio_hint": "foks", "visual_hint": "f·o·x",  "sentence": "The clever red fox dashed away."},
        {"word": "pen",  "difficulty": "easy", "category": "CVC", "audio_hint": "pen",  "visual_hint": "p·e·n",  "sentence": "Write your name with a blue pen."},
        {"word": "bug",  "difficulty": "easy", "category": "CVC", "audio_hint": "bug",  "visual_hint": "b·u·g",  "sentence": "A tiny green bug crawled on the leaf."},
        {"word": "box",  "difficulty": "easy", "category": "CVC", "audio_hint": "boks", "visual_hint": "b·o·x",  "sentence": "Open the shiny gift box."},
        {"word": "van",  "difficulty": "easy", "category": "CVC", "audio_hint": "van",  "visual_hint": "v·a·n",  "sentence": "The yellow delivery van drove down the road."},
    ],
    2: [
        {"word": "frog", "difficulty": "medium", "category": "blends",      "audio_hint": "frog", "visual_hint": "f·r·o·g", "sentence": "The green frog jumped in the pond."},
        {"word": "clap", "difficulty": "medium", "category": "blends",      "audio_hint": "clap", "visual_hint": "c·l·a·p", "sentence": "Clap your hands to the music."},
        {"word": "drum", "difficulty": "medium", "category": "blends",      "audio_hint": "drum", "visual_hint": "d·r·u·m", "sentence": "Beat the rhythm on the drum."},
        {"word": "ship", "difficulty": "medium", "category": "sh digraph",  "audio_hint": "ship", "visual_hint": "sh·i·p", "sentence": "The big ship sailed across the sea."},
        {"word": "fish", "difficulty": "medium", "category": "sh digraph",  "audio_hint": "fish", "visual_hint": "f·i·s·h", "sentence": "A colourful fish swam past."},
        {"word": "path", "difficulty": "medium", "category": "th digraph",  "audio_hint": "path", "visual_hint": "p·a·t·h", "sentence": "Walk along the forest path."},
        {"word": "wind", "difficulty": "medium", "category": "blends",      "audio_hint": "wind", "visual_hint": "w·i·n·d", "sentence": "The cool wind blew the leaves."},
        {"word": "jump", "difficulty": "medium", "category": "blends",      "audio_hint": "jump", "visual_hint": "j·u·m·p", "sentence": "Jump high into the air."},
        {"word": "nest", "difficulty": "medium", "category": "blends",      "audio_hint": "nest", "visual_hint": "n·e·s·t", "sentence": "A tiny bird built a snug nest."},
        {"word": "star", "difficulty": "medium", "category": "blends",      "audio_hint": "star", "visual_hint": "s·t·a·r", "sentence": "Look up at the bright twinkling star."},
        {"word": "crab", "difficulty": "medium", "category": "blends",      "audio_hint": "krab", "visual_hint": "c·r·a·b", "sentence": "The little sand crab scurried away."},
        {"word": "flag", "difficulty": "medium", "category": "blends",      "audio_hint": "flag", "visual_hint": "f·l·a·g", "sentence": "The colourful flag waved in the breeze."},
        {"word": "bell", "difficulty": "medium", "category": "ll digraph",  "audio_hint": "bel",  "visual_hint": "b·e·l·l", "sentence": "Ring the golden school bell."},
        {"word": "chin", "difficulty": "medium", "category": "ch digraph",  "audio_hint": "chin", "visual_hint": "ch·i·n", "sentence": "Rest your chin on your hand."},
        {"word": "plum", "difficulty": "medium", "category": "blends",      "audio_hint": "plum", "visual_hint": "p·l·u·m", "sentence": "Pick a sweet purple plum from the tree."},
    ],
    3: [
        {"word": "wrist",  "difficulty": "medium", "category": "silent letter", "audio_hint": "rist",  "visual_hint": "w·r·i·s·t",   "sentence": "Wear a watch on your wrist."},
        {"word": "knock",  "difficulty": "medium", "category": "silent letter", "audio_hint": "nok",   "visual_hint": "k·n·o·c·k",   "sentence": "Knock gently on the wooden door."},
        {"word": "thumb",  "difficulty": "medium", "category": "silent letter", "audio_hint": "thum",  "visual_hint": "t·h·u·m·b",   "sentence": "Give a big thumbs up."},
        {"word": "light",  "difficulty": "medium", "category": "silent gh",     "audio_hint": "lite",  "visual_hint": "l·i·g·h·t",   "sentence": "Turn on the reading light."},
        {"word": "bread",  "difficulty": "medium", "category": "vowel team",    "audio_hint": "bred",  "visual_hint": "b·r·e·a·d",   "sentence": "Smell the fresh baked bread."},
        {"word": "knight", "difficulty": "medium", "category": "silent letter", "audio_hint": "night", "visual_hint": "k·n·i·g·h·t", "sentence": "The brave knight rode to the castle."},
        {"word": "train",  "difficulty": "medium", "category": "vowel team",    "audio_hint": "trayn", "visual_hint": "t·r·a·i·n",   "sentence": "The train arrived at the station."},
        {"word": "float",  "difficulty": "medium", "category": "vowel team",    "audio_hint": "flote", "visual_hint": "f·l·o·a·t",   "sentence": "Paper boats float on water."},
        {"word": "sword",  "difficulty": "medium", "category": "silent letter", "audio_hint": "sord",  "visual_hint": "s·w·o·r·d",   "sentence": "The story had a shining toy sword."},
        {"word": "climb",  "difficulty": "medium", "category": "silent letter", "audio_hint": "klym",  "visual_hint": "c·l·i·m·b",   "sentence": "Climb up the big playground slide."},
        {"word": "beach",  "difficulty": "medium", "category": "vowel team",    "audio_hint": "beech", "visual_hint": "b·e·a·c·h",   "sentence": "We built sandcastles on the sunny beach."},
        {"word": "gnome",  "difficulty": "medium", "category": "silent letter", "audio_hint": "nome",  "visual_hint": "g·n·o·m·e",   "sentence": "A friendly garden gnome stood by the flowers."},
    ],
    4: [
        {"word": "sunshine",   "difficulty": "hard", "category": "compound",      "audio_hint": "sun-shine",   "visual_hint": "sun·shine",    "sentence": "Warm sunshine filled the room."},
        {"word": "adventure",  "difficulty": "hard", "category": "multisyllabic", "audio_hint": "ad-ven-chur", "visual_hint": "ad·ven·ture",   "sentence": "Every book is a great adventure."},
        {"word": "wonderful",  "difficulty": "hard", "category": "multisyllabic", "audio_hint": "wun-der-ful", "visual_hint": "won·der·ful",   "sentence": "You did a wonderful job today."},
        {"word": "together",   "difficulty": "hard", "category": "multisyllabic", "audio_hint": "to-geth-er",  "visual_hint": "to·geth·er",    "sentence": "We can read this story together."},
        {"word": "kindness",   "difficulty": "hard", "category": "multisyllabic", "audio_hint": "kynd-ness",   "visual_hint": "kind·ness",    "sentence": "Always treat your friends with kindness."},
        {"word": "understand", "difficulty": "hard", "category": "multisyllabic", "audio_hint": "un-der-stand","visual_hint": "un·der·stand", "sentence": "Now I understand how the word works."},
        {"word": "butterfly",  "difficulty": "hard", "category": "compound",      "audio_hint": "but-er-fly",  "visual_hint": "but·ter·fly",  "sentence": "A gentle butterfly fluttered past."},
        {"word": "rainbow",    "difficulty": "hard", "category": "compound",      "audio_hint": "rayn-boh",    "visual_hint": "rain·bow",     "sentence": "A double rainbow arched across the sky."},
        {"word": "discover",   "difficulty": "hard", "category": "multisyllabic", "audio_hint": "dis-kuv-er",  "visual_hint": "dis·cov·er",   "sentence": "Discover exciting facts in every chapter."},
        {"word": "celebrate",  "difficulty": "hard", "category": "multisyllabic", "audio_hint": "sel-e-brayt", "visual_hint": "cel·e·brate",  "sentence": "Let us celebrate your great reading progress!"},
    ],
}


def _instant_select_word(
    reading_level: int,
    struggling_words: list = None,
    mastered_words: list = None,
    words_done_this_session: list = None,
    last_answer_correct: bool = True,
    consecutive_wrong: int = 0,
    dyslexia_type: str = "unknown",
    error_pattern: str = "",
) -> dict:
    """Fallback generator used only if Gemini is unreachable or offline."""
    import random
    lvl = max(1, min(4, int(reading_level or 1)))
    if consecutive_wrong >= 2:
        lvl = max(1, lvl - 1)

    done_set = {str(w).lower().strip() for w in (words_done_this_session or []) if str(w).strip()}
    candidates = STAGE_FALLBACKS.get(lvl, STAGE_FALLBACKS[1])

    available = [item for item in candidates if item["word"].lower() not in done_set]
    if not available:
        # If all stage candidates done, try any stage not yet done
        for other_lvl in [1, 2, 3, 4]:
            alt = [item for item in STAGE_FALLBACKS[other_lvl] if item["word"].lower() not in done_set]
            if alt:
                available = alt
                break

    chosen_meta = random.choice(available) if available else candidates[0]
    word = chosen_meta["word"]
    
    return {
        "word":        word,
        "difficulty":  chosen_meta.get("difficulty", "easy" if lvl < 3 else "medium"),
        "category":    chosen_meta.get("category", "practice"),
        "audio_hint":  chosen_meta.get("audio_hint", word),
        "visual_hint": chosen_meta.get("visual_hint", "·".join(list(word))),
        "sentence":    chosen_meta.get("sentence", f"The {word} appeared on the screen."),
        "why_chosen":  f"Selected for Stage {lvl} phonics practice matching child's profile.",
    }


def select_next_word(
    reading_level: int = 1,
    dyslexia_type: str = "phonological",
    error_pattern: str = "",
    co_occurring: list = None,
    approach: str = "phonics",
    struggling_words: list = None,
    mastered_words: list = None,
    words_done_this_session: list = None,
    last_answer_correct: bool = True,
    consecutive_correct: int = 0,
    consecutive_wrong: int = 0,
    adaptation_action: str = "continue",
) -> dict:
    """
    Selects or generates the optimal next word dynamically using Gemini 2.5 Flash.
    Fully personalized to:
      1. reading_stage (1=CVC, 2=Digraphs/blends, 3=Silent letters, 4=Multisyllabic)
      2. error_pattern (e.g. silent_letter, vowel_confusion, b_d_reversal)
      3. dyslexia_type & co-occurring conditions (ADHD, Autism, etc.)
      4. words_done_this_session (guarantees zero duplicates in the same session)
    """
    lvl = max(1, min(4, int(reading_level or 1)))
    done_list = [str(w).lower().strip() for w in (words_done_this_session or []) if str(w).strip()]
    cond_list = [str(c).lower().strip() for c in (co_occurring or []) if str(c).strip() and str(c).lower() != "none"]

    prompt = f"""You are the Word Selector Agent for WordBloom, an adaptive reading system for children.
Generate the optimal next reading practice word for this student:

STUDENT PROFILE:
- Reading Stage: Stage {lvl}
  (Stage 1 = simple 3-letter CVC short vowels e.g. sun, hop, bat, cup, net)
  (Stage 2 = 4-5 letter consonant blends & digraphs e.g. frog, clap, drum, ship, fish, path, jump)
  (Stage 3 = silent letters & complex vowel teams e.g. wrist, knock, thumb, light, bread, knight)
  (Stage 4 = multisyllabic & compound words e.g. sunshine, adventure, wonderful, together, explore)
- Dyslexia Profile: {dyslexia_type}
- Co-occurring Conditions: {', '.join(cond_list) if cond_list else 'none'}
- Mastered Words (do not select): {mastered_words or []}
- Words Already Struggling With: {struggling_words or []}

CURRENT SESSION STATE:
- Words Already Done This Session (CRITICAL: NEVER REPEAT ANY OF THESE): {done_list}
- Last Answer Was: {"Correct" if last_answer_correct else "Incorrect"}
- Error Pattern Just Made: {error_pattern or 'none'}
- Target Difficulty Action: {adaptation_action}
- Consecutive Wrong: {consecutive_wrong}
- Consecutive Correct: {consecutive_correct}

ADAPTIVE RULES:
1. Generate a real, age-appropriate English word strictly matching Stage {lvl}.
2. If error_pattern is "silent_letter", choose a word focusing on silent letter patterns (e.g. thumb, wrist, knock, wrap).
3. If error_pattern is "b_d_reversal" or dyslexia_type is "visual", prefer words without confusing mirror letters (b/d/p/q).
4. If consecutive_wrong >= 2 or adaptation_action is "make_easier", select a simple, high-confidence word at Stage {max(1, lvl-1)}.
5. If adaptation_action is "make_harder", select a rich word with an interesting phonics rule at Stage {min(4, lvl+1)}.
6. audio_hint MUST be plain phonetic English (e.g. "thum", "nite", "rist" - NEVER use unicode diacritics or IPA symbols).
7. visual_hint MUST be dot-separated letters or phonemes (e.g. "th·u·m·b", "f·r·o·g").
8. Provide a cheerful, child-friendly sentence using the word.

Return ONLY a valid JSON object matching this schema:
{{
    "word": "single_word",
    "difficulty": "easy" | "medium" | "hard",
    "category": "phonics category name",
    "phonics_rule": "short rule description",
    "audio_hint": "plain phonetic pronunciation",
    "visual_hint": "dot·separated·word",
    "sentence": "Warm child-friendly sentence with the word.",
    "why_chosen": "1 sentence pedagogical rationale citing student stage and error pattern."
}}"""

    try:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            max_output_tokens=160,
            temperature=0.7,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=prompt,
            config=config,
        )
        result = _parse_json(response.text)

        if isinstance(result, dict) and result.get("word"):
            raw_word = str(result["word"]).lower().strip().replace(" ", "")
            # Ensure no punctuation or weird characters
            clean_word = "".join([c for c in raw_word if c.isalpha()])
            
            # Check if Gemini accidentally repeated an already-done word
            if clean_word and clean_word not in done_list:
                result["word"] = clean_word
                if not result.get("sentence"):
                    result["sentence"] = f"The {clean_word} appeared on the screen."
                if not result.get("visual_hint") or "·" not in str(result["visual_hint"]):
                    result["visual_hint"] = "·".join(list(clean_word))
                if not result.get("audio_hint"):
                    result["audio_hint"] = clean_word
                print(f"   ✨ Gemini dynamically generated: '{clean_word}' (Stage {lvl})")
                return result

    except Exception as e:
        print(f"⚠️ Gemini word generation fallback triggered: {e}")

    # Fallback if Gemini timed out or generated an invalid/repeated word
    return _instant_select_word(
        reading_level=lvl,
        struggling_words=struggling_words,
        mastered_words=mastered_words,
        words_done_this_session=words_done_this_session,
        last_answer_correct=last_answer_correct,
        consecutive_wrong=consecutive_wrong,
        dyslexia_type=dyslexia_type,
        error_pattern=error_pattern,
    )


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
word_selector_agent = Agent(
    name="WordSelectorAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Selects or generates the optimal next word dynamically using Gemini
        tailored to child profile, reading stage, and detected error patterns.
        Runs SECOND after ProfileAgent.
    """,

    instruction="""
        You are the Word Selector Agent for WordBloom.

        Your ONLY job:
        1. Receive child profile, reading stage, and evaluator error patterns.
        2. Call select_next_word() with full session state.
        3. Return the personalized word dict with hints, sentence, and why_chosen.

        Never repeat a word already done this session.
        Adapt dynamically to error patterns (e.g. silent letter, b/d reversals).
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
        return {}
