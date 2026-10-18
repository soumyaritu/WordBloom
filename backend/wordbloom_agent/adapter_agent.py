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

import io
import base64
import math
from PIL import Image, ImageDraw, ImageFont

try:
    from gtts import gTTS
except ImportError:
    gTTS = None

try:
    from google.cloud import texttospeech
    _tts_client = texttospeech.TextToSpeechClient()
except Exception:
    _tts_client = None

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

WORD_MEANINGS = {
    "plan": ("✈️", "A step-by-step drawing or paper plane before flying!"),
    "plane": ("✈️", "An aircraft that flies high through the sky!"),
    "sun": ("☀️", "The warm, bright yellow star in our sky!"),
    "sunny": ("☀️", "Full of bright, warm sunshine!"),
    "cat": ("🐱", "A friendly furry pet with whiskers and a tail!"),
    "dog": ("🐶", "A playful pup that wags its tail!"),
    "hop": ("🐰", "To jump up on one foot or leap like a bunny!"),
    "cup": ("🥤", "A small container used for drinking cocoa or milk!"),
    "bat": ("🦇", "A flying animal with wings or a bat for ball games!"),
    "net": ("🥅", "A mesh used to catch balls in sports or fish!"),
    "jug": ("🏺", "A container with a handle for pouring water!"),
    "cap": ("🧢", "A hat with a visor to keep sun from your eyes!"),
    "map": ("🗺️", "A drawing that guides you to find places!"),
    "bed": ("🛏️", "A cozy soft place to sleep at night!"),
    "fox": ("🦊", "A clever wild animal with an orange bushy tail!"),
    "box": ("📦", "A sturdy container to store treasures!"),
    "star": ("🌟", "A glowing point of light in the night sky!"),
    "frog": ("🐸", "A green amphibian that croaks and leaps!"),
    "drum": ("🥁", "A musical instrument you tap with sticks!"),
    "fish": ("🐟", "A swimming creature with scales and fins!"),
    "ship": ("🚢", "A large boat that sails across the ocean!"),
    "wrist": ("⌚", "The joint connecting your hand to your arm!"),
    "thumb": ("👍", "The short, thick first digit of your hand!"),
    "knock": ("🚪", "Tapping on a door to ask if someone is home!"),
    "knight": ("🛡️", "A brave hero from history in shining armor!"),
}


def get_word_meaning(word: str) -> tuple:
    w = str(word or "").lower().strip()
    if w in WORD_MEANINGS:
        return WORD_MEANINGS[w]
    return ("💡", f"Look at the letters and sound blocks for '{word}'!")


# UK Synthetic Phonics IPA Phonemes (UK DfE Letters and Sounds / Jolly Phonics / Read Write Inc)
# Pure sounds: No schwa 'uh' added to consonants
UK_PHONEMES_IPA = {
    # Short vowels (UK RP)
    "a": "æ",   # cat, plan, bat
    "e": "e",   # bed, net, red
    "i": "ɪ",   # fish, win, pin
    "o": "ɒ",   # dog, hop, box
    "u": "ʌ",   # sun, cup, run

    # Pure consonants (unvoiced & voiced)
    "b": "b",
    "c": "k",
    "d": "d",
    "f": "f",
    "g": "ɡ",
    "h": "h",
    "j": "dʒ",
    "k": "k",
    "l": "l",
    "m": "m",
    "n": "n",
    "p": "p",
    "q": "kw",
    "r": "r",
    "s": "s",
    "t": "t",
    "v": "v",
    "w": "w",
    "x": "ks",
    "y": "j",
    "z": "z",

    # UK Digraphs
    "sh": "ʃ",   # ship, fish
    "ch": "tʃ",  # chop
    "th": "θ",   # thumb
    "ck": "k",   # lock, knock
    "wh": "w",   # whip
    "ph": "f",   # photo
    "qu": "kw",  # quick
    "ng": "ŋ",   # sing
}


def build_uk_phonics_ssml(word: str) -> tuple:
    """
    Constructs UK synthetic phonics SSML using IPA pure sounds and sound blending.
    Returns: (ssml_string, display_chunks, spoken_summary)
    """
    clean = "".join([c for c in str(word or "").lower().strip() if c.isalpha()])
    if not clean:
        clean = "word"

    tokens = []
    i = 0
    while i < len(clean):
        if i + 2 <= len(clean) and clean[i:i+2] in UK_PHONEMES_IPA:
            tokens.append(clean[i:i+2])
            i += 2
        else:
            tokens.append(clean[i])
            i += 1

    display_chunks = " ... ".join(tokens)

    phoneme_elements = []
    for tok in tokens:
        ipa = UK_PHONEMES_IPA.get(tok, tok)
        phoneme_elements.append(
            f'<phoneme alphabet="ipa" ph="{ipa}">{tok}</phoneme><break time="420ms"/>'
        )

    phonemes_ssml = " ".join(phoneme_elements)

    ssml = f"""<speak>
  Let's sound it out.
  <break time="250ms"/>
  {phonemes_ssml}
  <break time="400ms"/>
  Together: <emphasis level="strong">{clean}</emphasis>!
</speak>"""

    spoken_summary = f"Sound it out: {display_chunks}. Together: {clean}!"
    return ssml, display_chunks, spoken_summary


def generate_tts_audio_scaffold(word: str) -> tuple:
    """
    Generates authentic UK synthetic phonics pure sounds and blending audio.
    Uses Google Cloud Neural2 UK British voice (en-GB-Neural2-A) with IPA SSML.
    Falls back to gTTS UK English (tld='co.uk') if cloud client is unavailable.
    Returns (base64_mp3_string, phonics_display_text, phonics_spoken_text).
    """
    word = str(word or "word").strip().lower()
    ssml, display_chunks, spoken_summary = build_uk_phonics_ssml(word)

    b64_audio = None
    if _tts_client:
        try:
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml)
            voice = texttospeech.VoiceSelectionParams(
                language_code="en-GB",
                name="en-GB-Neural2-A",
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=0.9,
            )
            response = _tts_client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
            b64_audio = base64.b64encode(response.audio_content).decode("utf-8")
        except Exception as e:
            print(f"⚠️ Google Cloud Text-to-Speech UK error: {e}")
            b64_audio = None

    if not b64_audio and gTTS:
        try:
            tts = gTTS(text=spoken_summary, lang="en", tld="co.uk", slow=False)
            buf = io.BytesIO()
            tts.write_to_fp(buf)
            b64_audio = base64.b64encode(buf.getvalue()).decode("utf-8")
        except Exception as e:
            print(f"⚠️ gTTS UK audio fallback error: {e}")
            b64_audio = None

    return b64_audio, display_chunks, spoken_summary


def draw_cartoon_anchor(draw, cx: int, cy: int, word: str):
    """Draws a clean, child-friendly vector cartoon illustration anchor for the word."""
    w = str(word or "").lower().strip()
    if w in ["plan", "plane"]:
        # Cartoon paper airplane gliding with wind streaks
        draw.polygon([(cx + 30, cy - 4), (cx - 24, cy - 20), (cx - 8, cy - 4)], fill=(255, 255, 255), outline=(59, 130, 246))
        draw.polygon([(cx + 30, cy - 4), (cx - 8, cy - 4), (cx - 24, cy + 18)], fill=(203, 213, 225), outline=(59, 130, 246))
        draw.line([(cx - 8, cy - 4), (cx - 8, cy + 10)], fill=(148, 163, 184), width=2)
        draw.arc([cx - 42, cy + 8, cx - 18, cy + 24], 180, 360, fill=(96, 165, 250), width=2)
        draw.arc([cx - 50, cy + 16, cx - 30, cy + 30], 180, 360, fill=(96, 165, 250), width=2)
    elif w in ["sun", "sunny"]:
        draw.ellipse([cx - 18, cy - 18, cx + 18, cy + 18], fill=(251, 191, 36), outline=(245, 158, 11), width=2)
        for i in range(8):
            rad = i * (math.pi / 4)
            x1 = cx + int(21 * math.cos(rad))
            y1 = cy + int(21 * math.sin(rad))
            x2 = cx + int(30 * math.cos(rad))
            y2 = cy + int(30 * math.sin(rad))
            draw.line([x1, y1, x2, y2], fill=(245, 158, 11), width=3)
    elif w in ["cat", "kitten"]:
        draw.ellipse([cx - 18, cy - 14, cx + 18, cy + 18], fill=(251, 146, 60), outline=(234, 88, 12), width=2)
        draw.polygon([(cx - 14, cy - 10), (cx - 20, cy - 26), (cx - 6, cy - 14)], fill=(251, 146, 60), outline=(234, 88, 12))
        draw.polygon([(cx + 14, cy - 10), (cx + 20, cy - 26), (cx + 6, cy - 14)], fill=(251, 146, 60), outline=(234, 88, 12))
    elif w in ["hop", "bunny", "rabbit"]:
        draw.ellipse([cx - 16, cy - 8, cx + 16, cy + 18], fill=(241, 245, 249), outline=(148, 163, 184), width=2)
        draw.ellipse([cx - 14, cy - 30, cx - 4, cy - 4], fill=(241, 245, 249), outline=(148, 163, 184), width=2)
        draw.ellipse([cx + 4, cy - 30, cx + 14, cy - 4], fill=(241, 245, 249), outline=(148, 163, 184), width=2)
    elif w in ["cup", "mug"]:
        draw.rounded_rectangle([cx - 16, cy - 12, cx + 16, cy + 16], radius=5, fill=(59, 130, 246), outline=(37, 99, 235), width=2)
        draw.arc([cx + 12, cy - 4, cx + 24, cy + 10], 270, 90, fill=(37, 99, 235), width=3)
    else:
        draw.ellipse([cx - 18, cy - 18, cx + 18, cy + 18], fill=(16, 185, 129), outline=(5, 150, 105), width=2)
        draw.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=(255, 255, 255))


def generate_visual_hint(
    word: str,
    dyslexia_type: str = "surface",
    is_voice: bool = False,
    meaning_icon: str = "✈️",
    meaning_desc: str = "",
) -> str:
    """
    Generates a high-contrast visual hint card as a base64 PNG.
    When is_voice is True, creates a Visual Meaning Anchor with cartoon illustration,
    letter sound boxes, and phonics chunk guide.
    """
    word = str(word or "word").strip().lower()
    width, height = 500, 240
    img = Image.new("RGB", (width, height), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)

    # Outer border
    draw.rounded_rectangle(
        [4, 4, width - 4, height - 4],
        radius=16,
        outline=(59, 130, 246) if is_voice else (16, 185, 129),
        width=2,
    )

    # System fonts
    font_large = None
    font_small = None
    font_badge = None
    for p in [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]:
        if os.path.exists(p):
            try:
                font_large = ImageFont.truetype(p, 36)
                font_small = ImageFont.truetype(p, 14)
                font_badge = ImageFont.truetype(p, 12)
                break
            except Exception:
                pass
    if not font_large:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_badge = ImageFont.load_default()

    # Header Badge
    badge_label = "VISUAL MEANING ANCHOR" if is_voice else "VISUAL HINT"
    badge_width = 210 if is_voice else 165
    draw.rounded_rectangle([18, 12, badge_width, 36], radius=12, fill=(30, 41, 59), outline=(59, 130, 246), width=1)
    draw.ellipse([26, 19, 36, 29], fill=(16, 185, 129) if is_voice else (245, 158, 11))
    draw.text((42, 16), badge_label, fill=(96, 165, 250), font=font_badge)

    dt_label = "Targeting: Voice phonics & meaning support" if is_voice else f"Targeting: {str(dyslexia_type or 'surface').capitalize()} support"
    draw.text((badge_width + 12, 17), dt_label, fill=(148, 163, 184), font=font_badge)

    # Cartoon illustration box on the left when is_voice
    start_x = 18
    if is_voice:
        draw.rounded_rectangle([20, 50, 110, 140], radius=14, fill=(30, 58, 138), outline=(59, 130, 246), width=2)
        draw_cartoon_anchor(draw, 65, 95, word)
        start_x = 125

    # Word letter boxes
    n = len(word)
    avail_w = width - start_x - 20
    box_w = min(56, max(36, avail_w // max(n, 1) - 8))
    box_h = 70
    gap = 8
    total_w = n * box_w + (n - 1) * gap
    letter_start_x = start_x + (avail_w - total_w) // 2
    y_pos = 50

    palette = [
        ((16, 185, 129), (6, 78, 59)),    # Green
        ((59, 130, 246), (30, 58, 138)),  # Blue
        ((245, 158, 11), (120, 53, 15)),  # Amber/Vowel
        ((236, 72, 153), (131, 24, 67)),  # Pink
        ((168, 85, 247), (88, 28, 135)),  # Purple
    ]

    vowels = set("aeiou")
    for i, ch in enumerate(word):
        bx = letter_start_x + i * (box_w + gap)
        c_outline, _ = palette[2] if ch in vowels else palette[i % len(palette)]
        
        # Tile background & border
        draw.rounded_rectangle([bx, y_pos, bx + box_w, y_pos + box_h], radius=12, fill=(30, 41, 59), outline=c_outline, width=2)
        
        # Heavy bottom anchor line for dyslexia stabilization
        draw.line([bx + 8, y_pos + box_h - 8, bx + box_w - 8, y_pos + box_h - 8], fill=c_outline, width=3)

        # Center letter in tile
        bbox = draw.textbbox((0, 0), ch, font=font_large)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = bx + (box_w - tw) // 2
        ty = y_pos + (box_h - th) // 2 - 4
        draw.text((tx, ty), ch, fill=(248, 250, 252), font=font_large)

    # Meaning line if is_voice and meaning_desc provided
    if is_voice and meaning_desc:
        desc_text = f'Meaning: "{meaning_desc[:38]}..."' if len(meaning_desc) > 40 else f'Meaning: "{meaning_desc}"'
        draw.text((125, 130), desc_text, fill=(226, 232, 240), font=font_small)

    # Bottom guidance text
    chunk_text = " ... ".join(list(word))
    footer = f'Phonics sound-out:  "{chunk_text}"'
    bbox_f = draw.textbbox((0, 0), footer, font=font_small)
    fx = (width - (bbox_f[2] - bbox_f[0])) // 2
    draw.rounded_rectangle([18, 185, width - 18, 225], radius=10, fill=(30, 41, 59), outline=(59, 130, 246), width=1)
    draw.text((fx, 196), footer, fill=(96, 165, 250), font=font_small)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


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
    candy_goal: int = 5,
    words_correct: int = 0,
    needs_visual_hint: bool = False,
    word: str = "",
    input_mode: str = "type",
    attempt_number: int = 1,
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
        session_length_mins: max safety session length from profile
        time_elapsed_mins:   how long session has been running
        consecutive_correct: how many correct in a row
        consecutive_wrong:   how many wrong in a row
        current_level:       current reading level 1-4
        candy_goal:          target candies to earn to complete the session
        words_correct:       total correct words (candies earned) so far

    Returns:
        Adaptation action dict
    """
    # Robust handling for conditions (None, string, or list)
    if co_occurring is None:
        co_occurring = []
    elif isinstance(co_occurring, str):
        co_occurring = [c.strip() for c in co_occurring.split(",") if c.strip() and c.strip().lower() != "none"]

    has_adhd   = any("adhd" in str(c).lower() for c in co_occurring)
    has_autism = any("autism" in str(c).lower() for c in co_occurring)
    is_double  = "double" in str(dyslexia_type or "").lower()
    is_non_dyslexic = any(k in str(dyslexia_type or "").lower() for k in ["non_dyslexic", "non-dyslexic", "none", "general", "normal", "standard"])

    # Safe numeric coercion
    try:
        session_length_mins = float(session_length_mins) if session_length_mins is not None else 10.0
    except (ValueError, TypeError):
        session_length_mins = 10.0

    try:
        candy_goal = int(candy_goal) if candy_goal is not None else (5 if has_adhd else 10)
    except (ValueError, TypeError):
        candy_goal = 5 if has_adhd else 10

    try:
        words_correct = int(words_correct) if words_correct is not None else 0
    except (ValueError, TypeError):
        words_correct = 0

    try:
        break_after = int(break_after) if break_after is not None else 10
    except (ValueError, TypeError):
        break_after = 10

    try:
        words_done = int(words_done) if words_done is not None else 0
    except (ValueError, TypeError):
        words_done = 0

    try:
        time_elapsed_mins = float(time_elapsed_mins) if time_elapsed_mins is not None else 0.0
    except (ValueError, TypeError):
        time_elapsed_mins = 0.0

    try:
        consecutive_correct = int(consecutive_correct) if consecutive_correct is not None else 0
    except (ValueError, TypeError):
        consecutive_correct = 0

    try:
        consecutive_wrong = int(consecutive_wrong) if consecutive_wrong is not None else 0
    except (ValueError, TypeError):
        consecutive_wrong = 0

    try:
        current_level = int(current_level) if current_level is not None else 1
    except (ValueError, TypeError):
        current_level = 1

    # ADHD profile settings (auto-locked)
    effective_session_len = 5.0 if has_adhd else session_length_mins
    effective_break_after = 5 if has_adhd else max(1, break_after)
    effective_candy_goal  = 5 if has_adhd else max(1, candy_goal)

    # Goal-driven completion: child earns their target candies!
    # A session goal is ONLY reached upon successful words where candies earned >= target goal.
    goal_reached = bool(is_correct) and effective_candy_goal > 0 and words_correct >= effective_candy_goal

    # Safety ceiling timer: only triggers if session goal is met or student finished a word
    safety_timeout = bool(is_correct) and time_elapsed_mins >= (effective_session_len * 2)

    session_over = goal_reached

    # Only offer a break after a successful word, never during wrong answer struggle, and not if session is over
    force_break = (
        not session_over and is_correct and effective_break_after > 0 and words_done >= effective_break_after and (words_done % effective_break_after == 0)
    )

    if session_over:
        action = "end_session"
        reason = f"🎉 Goal achieved! {words_correct}/{effective_candy_goal} candies earned."
    elif not is_correct:
        # Child missed or struggled: NEVER end session, adapt difficulty to help them succeed!
        if consecutive_wrong >= 2:
            action = "make_easier"
            reason = f"{consecutive_wrong} wrong in a row — stepping back to build confidence"
        else:
            action = "continue"
            reason = "Good effort — trying another word to practice"
    elif force_break:
        action = "take_break"
        reason = "Break time — rest your eyes and stretch" if has_adhd else "Great work! Time for a short break"
    elif consecutive_correct >= 3 and (is_non_dyslexic or (not is_double and not has_autism)):
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

    visual_hint_b64 = None
    audio_scaffold_b64 = None
    phonics_chunks = None
    phonics_spoken = None
    meaning_icon = None
    meaning_desc = None

    is_voice = str(input_mode or "").lower() == "voice"
    needs_scaffold = not is_correct and (needs_visual_hint or consecutive_wrong >= 2 or attempt_number >= 2)

    if needs_scaffold:
        target_word = word or "word"
        meaning_icon, meaning_desc = get_word_meaning(target_word)
        use_voice_anchor = is_voice or attempt_number >= 2
        visual_hint_b64 = generate_visual_hint(
            target_word,
            dyslexia_type,
            is_voice=use_voice_anchor,
            meaning_icon=meaning_icon,
            meaning_desc=meaning_desc,
        )
        # Google Text-to-Speech audio scaffold of authentic phoneme sounds and blending
        if is_voice or attempt_number >= 2:
            audio_scaffold_b64, phonics_chunks, phonics_spoken = generate_tts_audio_scaffold(target_word)

    return {
        "action":                  action,
        "level_change":            level_change,
        "approach_change":         approach_change,
        "break_duration_seconds":  30 if action == "take_break" else 0,
        "reason":                  reason,
        "session_over":            session_over,
        "goal_reached":            goal_reached,
        "candy_goal":              effective_candy_goal,
        "candies_earned":          words_correct,
        "visual_hint_b64":         visual_hint_b64,
        "audio_scaffold_b64":      audio_scaffold_b64,
        "phonics_chunks":          phonics_chunks,
        "phonics_spoken":          phonics_spoken,
        "meaning_icon":            meaning_icon,
        "meaning_desc":            meaning_desc,
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
