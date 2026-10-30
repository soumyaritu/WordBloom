from difflib import SequenceMatcher
"""
WordBloom — evaluator_agent.py
================================
Evaluator Agent — assesses child answer quality with profile-aware candy scoring.

Job:     Score the answer — not just right/wrong but HOW they answered
Input:   Correct word + child answer + response time + attempt number + child profile
Output:  Detailed evaluation driving adapter, encouragement, and reward systems

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
# PROFILE-AWARE CANDY SCORING THRESHOLDS
# ─────────────────────────────────────────────
DYSLEXIA_BASE = {
    "phonological":   0.75,
    "surface":        0.65,
    "visual_spatial": 0.70,
    "double_deficit": 0.60,
    "attentional":    0.72,
    "unknown":        0.65,
    "none":           1.00,
    "non_dyslexic":   1.00,
}

INPUT_ADJUSTMENT = {
    "voice": -0.12,   # speech-to-text adds noise beyond child's control
    "tap":   -0.08,   # tile interface has physical constraints
    "type":   0.00,   # baseline
}

STAGE_ADJUSTMENT = {
    1: +0.05,   # CVC words — simple, expect closer answers
    2:  0.00,   # blends — baseline
    3: -0.05,   # silent letters — phonetic approximations expected
    4: -0.08,   # multisyllabic — many valid phonetic variants
}

CONDITION_ADJUSTMENT = {
    "ADHD":      -0.05,   # attention lapses cause inconsistent performance
    "Autism":     0.00,   # predictable scoring — no threshold change
    "Dyspraxia": -0.03,   # small extra leniency beyond tap mode
}


def _normalize_dyslexia_type(dyslexia_type: str) -> str:
    if not dyslexia_type:
        return "unknown"
    dt = str(dyslexia_type).strip().lower().replace("/", "_").replace("-", "_").replace(" ", "_")
    if dt in ("visual", "visual_spatial"):
        return "visual_spatial"
    elif dt in ("double", "double_deficit"):
        return "double_deficit"
    elif dt in ("not_sure", "not_sure_yet", "unknown"):
        return "unknown"
    elif dt in ("non_dyslexic", "non_dyslexia", "none", "general", "normal", "standard"):
        return "non_dyslexic"
    return dt


def _normalize_condition(c: str) -> str:
    c_lower = str(c).strip().lower()
    if c_lower == "adhd":
        return "ADHD"
    elif c_lower == "autism":
        return "Autism"
    elif c_lower == "dyspraxia":
        return "Dyspraxia"
    return str(c).strip()


def get_candy_threshold(dyslexia_type, input_mode, reading_stage, conditions):
    """
    Computes profile-aware candy reward threshold based on dyslexia type,
    input method, reading stage, and co-occurring conditions.
    """
    norm_dt = _normalize_dyslexia_type(dyslexia_type)
    base  = DYSLEXIA_BASE.get(norm_dt, DYSLEXIA_BASE.get(dyslexia_type, 0.90))

    norm_input = str(input_mode or "type").strip().lower()
    adj   = INPUT_ADJUSTMENT.get(norm_input, INPUT_ADJUSTMENT.get(input_mode, 0.00))

    try:
        r_stage = int(reading_stage)
    except (ValueError, TypeError):
        r_stage = 1
    sadj  = STAGE_ADJUSTMENT.get(r_stage, 0.00)

    if isinstance(conditions, str):
        cond_list = [c.strip() for c in conditions.split(",") if c.strip() and c.strip().lower() != "none"]
    elif isinstance(conditions, (list, tuple)):
        cond_list = [c for c in conditions if str(c).strip().lower() not in ("", "none")]
    else:
        cond_list = []

    cadj  = sum(CONDITION_ADJUSTMENT.get(_normalize_condition(c), CONDITION_ADJUSTMENT.get(c, 0.00)) for c in cond_list)
    return round(max(0.50, base + adj + sadj + cadj), 2)


DYSLEXIC_MIRRORS = str.maketrans("bdpq", "dbqp")

SILENT_VARIANTS = {
    "knight": ["nite", "night"],
    "wrote": ["rote"],
    "thumb": ["thum"],
    "wrist": ["rist"],
    "gnome": ["nome"],
    "light": ["lite"],
    "through": ["thru", "threw"],
    "bread": ["bred"],
    "comb": ["com"],
    "lamb": ["lam"],
    "climb": ["clime", "clim"],
    "half": ["haf"],
    "calf": ["caf"],
    "sign": ["sine"],
    "knock": ["nock"],
    "know": ["no"],
    "knee": ["nee"],
    "wrap": ["rap"],
}

VOICE_HOMOPHONES = {
    "sun": ["son"],
    "son": ["sun"],
    "right": ["write"],
    "write": ["right"],
    "see": ["sea"],
    "sea": ["see"],
    "for": ["four"],
    "four": ["for"],
    "one": ["won"],
    "won": ["one"],
    "to": ["two", "too"],
    "two": ["to", "too"],
    "too": ["to", "two"],
    "be": ["bee"],
    "bee": ["be"],
    "hop": ["hope"],
    "hope": ["hop"],
    "not": ["note", "knot"],
    "knot": ["not", "note"],
    "rob": ["robe"],
    "robe": ["rob"],
    "pin": ["pine"],
    "pine": ["pin"],
    "cut": ["cute"],
    "cute": ["cut"],
    "tub": ["tube"],
    "tube": ["tub"],
    "cap": ["cape"],
    "cape": ["cap"],
    "tap": ["tape"],
    "tape": ["tap"],
    "rip": ["ripe"],
    "ripe": ["rip"],
    "dog": ["dawg"],
    "cat": ["kat"],
    "pop": ["pope"],
    "pope": ["pop"],
    "dot": ["dote"],
    "dote": ["dot"],
    "mop": ["mope"],
    "mope": ["mop"],
    "pan": ["pane", "pain"],
    "pane": ["pan", "pain"],
    "pain": ["pan", "pane"],
    "red": ["read", "reed"],
    "read": ["red", "reed"],
    "hear": ["here"],
    "here": ["hear"],
    "blue": ["blew"],
    "blew": ["blue"],
    "meat": ["meet"],
    "meet": ["meat"],
    "stair": ["stare"],
    "stare": ["stair"],
    "flour": ["flower"],
    "flower": ["flour"],
    "knight": ["night", "nite"],
    "night": ["knight", "nite"],
    "gnome": ["nome", "no", "know", "known", "gnomes", "nom", "num", "none"],
    "know": ["no"],
    "no": ["know"],
}


def is_correct_for_profile(correct_word, child_answer, dyslexia_type,
                            input_mode, reading_stage, conditions, partial_score, attempt_number=1):
    """
    Determines whether child answer earns candy based on profile threshold.
    For voice input, acoustic STT artifacts and homophones are evaluated directly
    (microphone acoustic distortion affects all learners).
    For non-dyslexic learners in written modes, standard exact spelling is required.
    For dyslexic learners, genuine dyslexia accommodations apply:
      - Mirror letter swaps (b/d, p/q) trigger scaffolded retry until the correct word is given
      - Silent letter phonetic variants e.g. knight -> nite
      - Voice mode homophones & acoustic STT phonetic variants e.g. sun -> son, hop -> hope
    Incorrect words (e.g. run for sun, cat for dog, bad for bed, bog for dog) are strictly False.
    """
    clean_target = str(correct_word or "").lower().strip(" .,!?:;'\"")
    clean_answer = str(child_answer or "").lower().strip(" .,!?:;'\"")

    if not clean_target or not clean_answer:
        return False

    if clean_target == clean_answer:
        return True

    # 1. Voice mode speech homophones & acoustic STT phonetic variants
    # (Evaluated before profile restrictions because microphone distortion / STT priors affect any speaker)
    if str(input_mode or "").lower() == "voice":
        if clean_answer in VOICE_HOMOPHONES.get(clean_target, []):
            return True
        # Carrier phrase tolerance (e.g. child says "a pin", "the pin", "it's pin")
        answer_tokens = [t.strip() for t in clean_answer.split() if t.strip()]
        if clean_target in answer_tokens:
            return True
        # Common STT vowel elongation (e.g. child says "hop" -> mic hears "hope")
        if clean_answer.endswith("e") and clean_answer[:-1] == clean_target:
            return True
        if clean_target.endswith("e") and clean_target[:-1] == clean_answer:
            return True

    norm_dt = _normalize_dyslexia_type(dyslexia_type)
    if norm_dt in ("non_dyslexic", "unknown", "not_sure", "not_sure_yet"):
        return False

    # 2. Mirror letter swap (b/d, p/q) when length is identical:
    # Scaffolded Retry: Never mark a mirror reversal as correct; keep the visual clue
    # active until the child provides the correct word.
    if len(clean_target) == len(clean_answer) and clean_answer.translate(DYSLEXIC_MIRRORS) == clean_target:
        return False

    # 3. Recognized silent letter phonetic variant
    if clean_answer in SILENT_VARIANTS.get(clean_target, []):
        return True

    # 4. High-fidelity near match for long multisyllabic words (Stage 4, 6+ letters) with single character typo
    if len(clean_target) >= 6 and abs(len(clean_target) - len(clean_answer)) <= 1 and partial_score >= 0.88:
        return True

    return False


VOWELS = set("aeiou")


def _is_vowel_confusion(clean_target: str, clean_answer: str) -> bool:
    """
    Detects vowel substitution / confusion where consonants match but vowel differs.
    e.g. 'dip' -> 'dap', 'dog' -> 'dug', 'bad' -> 'bed', 'pin' -> 'pen'
    """
    if not clean_target or not clean_answer or clean_target == clean_answer:
        return False
    if len(clean_target) == len(clean_answer):
        diffs = [(t, a) for t, a in zip(clean_target, clean_answer) if t != a]
        if diffs and all(t in VOWELS and a in VOWELS for t, a in diffs):
            return True
    return False


def _is_transposition(clean_target: str, clean_answer: str) -> bool:
    """
    Detects adjacent letter transposition / anagram swap with identical letter set.
    e.g. 'dip' -> 'dpi', 'chair' -> 'cahir', 'dog' -> 'dgo'
    """
    if not clean_target or not clean_answer or clean_target == clean_answer:
        return False
    if len(clean_target) == len(clean_answer) and len(clean_target) >= 2:
        return sorted(clean_target) == sorted(clean_answer)
    return False


# ─────────────────────────────────────────────
# TOOL
# ─────────────────────────────────────────────
def evaluate_answer(
    correct_word: str,
    child_answer: str,
    response_time_seconds: float = 5.0,
    input_mode: str = "type",
    attempt_number: int = 1,
    typical_response_time: float = 5.0,
    dyslexia_type: str = "unknown",
    reading_stage: int = 1,
    conditions: list = None,
) -> dict:
    """
    Evaluates child answer with nuance — profile-aware candy scoring.

    Args:
        correct_word:           the word that was shown
        child_answer:           what the child typed/said/tapped
        response_time_seconds:  how long they took to answer
        input_mode:             type / voice / tap
        attempt_number:         1 = first try, 2 = second try
        typical_response_time:  child's usual pace for comparison
        dyslexia_type:          child's dyslexia type
        reading_stage:          reading level stage (1-4)
        conditions:             co-occurring conditions (ADHD, Autism, etc.)

    Returns:
        Detailed evaluation dict including profile candy scoring fields
    """
    if conditions is None:
        conditions = []

    clean_target = str(correct_word or "").lower().strip(" .,!?:;'\"")
    clean_answer = str(child_answer or "").lower().strip(" .,!?:;'\"")
    exact_match = clean_target == clean_answer

    from collections import Counter
    target_counts = Counter(clean_target)
    answer_counts = Counter(clean_answer)
    shared_chars = sum(min(target_counts[c], answer_counts[c]) for c in target_counts)
    zip_matches = sum(1 for a, b in zip(clean_target, clean_answer) if a == b)
    letters_correct = max(zip_matches, shared_chars)

    sim_ratio = SequenceMatcher(None, clean_target, clean_answer).ratio()
    len_penalty = max(0, abs(len(clean_target) - len(clean_answer)) - 1) * 0.15
    partial_score = 1.0 if exact_match else max(0.0, round(sim_ratio - len_penalty, 2))

    if response_time_seconds < typical_response_time * 0.7:
        confidence = "fast"
    elif response_time_seconds < typical_response_time * 1.3:
        confidence = "normal"
    elif response_time_seconds < typical_response_time * 2.0:
        confidence = "slow"
    else:
        confidence = "very_slow"

    threshold_used = get_candy_threshold(dyslexia_type, input_mode, reading_stage, conditions)
    is_correct = is_correct_for_profile(
        correct_word=correct_word,
        child_answer=child_answer,
        dyslexia_type=dyslexia_type,
        input_mode=input_mode,
        reading_stage=reading_stage,
        conditions=conditions,
        partial_score=partial_score,
        attempt_number=attempt_number,
    )
    candy_earned = is_correct

    is_non_dyslexic = _normalize_dyslexia_type(dyslexia_type) == "non_dyslexic"

    clean_t = str(correct_word or "").lower().strip(" .,!?:;'\"")
    clean_a = str(child_answer or "").lower().strip(" .,!?:;'\"")
    is_mirror_swap = (len(clean_t) == len(clean_a) and clean_a.translate(DYSLEXIC_MIRRORS) == clean_t)
    is_silent_variant = clean_a in SILENT_VARIANTS.get(clean_t, [])
    is_transposition = _is_transposition(clean_t, clean_a)
    is_vowel_confusion = _is_vowel_confusion(clean_t, clean_a)

    is_voice_match = False
    if str(input_mode or "").lower() == "voice":
        if clean_a in VOICE_HOMOPHONES.get(clean_t, []):
            is_voice_match = True
        elif clean_a.endswith("e") and clean_a[:-1] == clean_t:
            is_voice_match = True
        elif clean_t.endswith("e") and clean_t[:-1] == clean_a:
            is_voice_match = True

    if exact_match:
        pattern = "correct"
        explanation = "Word read correctly!"
        positive_observation = f"Read '{correct_word}' accurately!"
    elif is_voice_match and is_correct:
        pattern = "voice_match"
        explanation = f"Spoken word '{correct_word}' recognized accurately! (Acoustic voice match for '{child_answer}')."
        positive_observation = f"Great, clear pronunciation of '{correct_word}'!"
    elif is_mirror_swap:
        pattern = "reversal"
        if is_correct:
            explanation = f"Word accepted with visual accommodation (mirror letter flip) on attempt {attempt_number}."
            positive_observation = f"Great persistence working through '{correct_word}'!"
        else:
            explanation = f"Mirror letter reversal detected (e.g. b↔d, p↔q) in '{correct_word}'. Look at the visual hint below to see which way the letter faces!"
            positive_observation = f"So close! You have the right sounds — look at the visual hint below to see which way the letter faces."
    elif is_transposition:
        pattern = "transposition"
        explanation = f"Letter swap (transposition) detected: '{child_answer}' for '{correct_word}'. Look at the visual hint below to see the correct order of letters!"
        positive_observation = f"You found all the letters in '{correct_word}'! Look at the visual hint below to see their exact order."
    elif is_vowel_confusion:
        pattern = "vowel_confusion"
        explanation = f"Vowel sound confusion detected: '{child_answer}' for '{correct_word}'. Look at the visual hint below to spot the middle vowel sound!"
        positive_observation = f"You got {letters_correct} of {len(correct_word)} letters right! Look at the visual hint below to see the vowel."
    elif is_silent_variant:
        pattern = "silent_letter"
        explanation = f"Phonetic attempt on tricky silent letter in '{correct_word}'."
        positive_observation = f"Great phonetic effort on the silent letter in '{correct_word}'!"
    elif is_correct and not is_non_dyslexic:
        pattern = "profile_accepted"
        explanation = f"Word accepted with verified dyslexia accommodations on attempt {attempt_number}."
        positive_observation = f"You spotted {letters_correct} letters in that tricky word!"
    else:
        if is_non_dyslexic:
            pattern = "spelling_error"
            explanation = f"Attempted '{child_answer}' for '{correct_word}'."
            positive_observation = f"Good effort! Identified {letters_correct} of {len(correct_word)} letters accurately."
        elif partial_score >= 0.5:
            pattern = "phonetic_attempt"
            explanation = f"Good phonetic effort! Identified {letters_correct} of {len(correct_word)} letters."
            positive_observation = f"Stayed engaged and identified {letters_correct} letter{'s' if letters_correct != 1 else ''}!"
        elif any(c in correct_word.lower() for c in ['k', 'gh', 'w', 'b', 'l']):
            pattern = "silent_letter"
            explanation = f"Tricky silent letter pattern in '{correct_word}'."
        else:
            pattern = "omission"
            explanation = f"Attempted '{child_answer}' for '{correct_word}'."

        is_voice_mode = str(input_mode or "").lower() == "voice"
        if is_voice_mode:
            positive_observation = f"Good voice effort! Listen closely to the sounds in '{correct_word}'."
        else:
            positive_observation = f"Stayed engaged and identified {letters_correct} letter{'s' if letters_correct != 1 else ''}!"

    needs_visual_hint = (not is_correct) and (
        attempt_number >= 2
        or is_mirror_swap
        or is_transposition
        or is_vowel_confusion
        or str(input_mode or "").lower() in ("type", "tap", "voice")
    )

    return {
        "correct":               is_correct,
        "is_correct":            is_correct,
        "needs_visual_hint":     needs_visual_hint,
        "word":                  correct_word,
        "candy_earned":          candy_earned,
        "partial_score":         partial_score,
        "threshold_used":        threshold_used,
        "dyslexia_type":         dyslexia_type,
        "input_mode":            input_mode,
        "reading_stage":         reading_stage,
        "conditions":            conditions,
        "letters_correct":       letters_correct,
        "letters_total":         len(correct_word),
        "confidence_signal":     confidence,
        "error_pattern":         pattern,
        "error_explanation":     explanation,
        "needs_break":           False,
        "positive_observation":  positive_observation,
    }


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
evaluator_agent = Agent(
    name="EvaluatorAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Evaluates child answer quality with profile-aware candy scoring.
        Identifies specific error patterns and applies dyslexia accommodations.
        Runs THIRD after WordSelectorAgent.
    """,

    instruction="""
        You are the Evaluator Agent for WordBloom.

        Your ONLY job:
        1. Receive the word, child answer, response time, and learner profile
        2. Call evaluate_answer() with all profile details
        3. Return the full evaluation dict with candy_earned and profile fields

        CRITICAL: For dyslexic children, right/wrong is not enough.
        Always identify what they DID correctly even in an imperfect answer.
        Never use negative framing in error_explanation.
        positive_observation must always find something true and good.
    """,

    tools=[evaluate_answer],
)


def _parse_json(text: str) -> dict:
    text = text.strip()
    fence = chr(96) * 3
    if f"{fence}json" in text:
        text = text.split(f"{fence}json")[1].split(fence)[0].strip()
    elif fence in text:
        text = text.split(fence)[1].split(fence)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "is_correct": False,
            "candy_earned": False,
            "partial_score": 0.5,
            "threshold_used": 0.65,
            "dyslexia_type": "unknown",
            "input_mode": "type",
            "reading_stage": 1,
            "conditions": [],
            "letters_correct": 0,
            "letters_total": 0,
            "confidence_signal": "normal",
            "error_pattern": "unknown",
            "error_explanation": "Could not evaluate",
            "needs_break": False,
            "positive_observation": "You tried — that is what matters"
        }
