"""
WordBloom — profile_agent.py
=============================
Profile Agent — loads child learning profile from Agent Skills.

Job:     Read child's profile markdown and return structured dict
Input:   child_name (e.g. "emma")
Output:  Complete profile dict driving all other agents

Always runs FIRST in the pipeline.
"""

import os
import re
from pathlib import Path
from google.adk.agents import Agent
from google.adk.skills import load_skill_from_dir
from dotenv import load_dotenv

load_dotenv()

SKILLS_DIR = Path(__file__).parent / "skills"


# ─────────────────────────────────────────────
# TOOL — reads child profile via ADK Skill API
# ─────────────────────────────────────────────
def load_child_profile(child_name: str) -> dict:
    """
    Loads child learning profile using official Google ADK Skills API.

    Args:
        child_name: First name of child e.g. "emma"

    Returns:
        Complete profile dict with dyslexia type, settings, progress
    """
    cleaned = child_name.lower().strip()
    target = cleaned.split()[0] if cleaned else "emma"
    if target in ["sony", "sony mathew"] and (SKILLS_DIR / "sofia").exists():
        target = "sofia"

    skill_dir = SKILLS_DIR / target

    if not skill_dir.exists() or not (skill_dir / "SKILL.md").exists():
        # Fallback scan across skill directories for matching name
        matched_dir = None
        if SKILLS_DIR.exists():
            for d in SKILLS_DIR.iterdir():
                if d.is_dir() and (d / "SKILL.md").exists():
                    txt = (d / "SKILL.md").read_text().lower()
                    if cleaned in txt or target in txt:
                        matched_dir = d
                        break
        if matched_dir:
            skill_dir = matched_dir
        else:
            return {
                "error": f"No skill package found for {child_name}",
                "child_name": child_name
            }

    skill = load_skill_from_dir(skill_dir)
    raw = skill.instructions

    def extract(pattern, default=""):
        match = re.search(pattern, raw, re.IGNORECASE | re.MULTILINE)
        return match.group(1).strip() if match else default

    def extract_list(pattern):
        match = re.search(pattern, raw, re.IGNORECASE | re.MULTILINE)
        if not match:
            return []
        raw_val = match.group(1).strip()
        return [w.strip() for w in raw_val.split(",") if w.strip()]

    profile = {
        "child_id":           child_name.lower().strip(),
        "child_name":         extract(r"- Full name:\s*(.+)"),
        "parent_email":       extract(r"- Parent email:\s*(.+)", "parent@example.com"),
        "age":                int(extract(r"- Age:\s*(\d+)", "9")),
        "school_year":        extract(r"- School year:\s*(.+)"),
        "dyslexia_type":      extract(r"- (?:Dyslexia type|Type):\s*(.+)", "unknown"),
        "severity":           extract(r"- Severity:\s*(.+)", "moderate"),
        "conditions":         extract_list(r"- (?:Conditions|Co-occurring):\s*(.+)"),
        "co_occurring":       extract_list(r"- (?:Conditions|Co-occurring):\s*(.+)"),
        "input_mode":         extract(r"- Input mode:\s*(.+)", "type"),
        "display_mode":       extract(r"- Display mode:\s*(.+)", "standard"),
        "colour_overlay":     extract(r"- Colour overlay:\s*(.+)", "none"),
        "show_timer":         extract(r"- Show timer:\s*(.+)", "never") != "yes",
        "score_display":      extract(r"- Score display:\s*(.+)", "stars"),
        "session_length":     int(extract(r"- Session length:\s*(\d+)", "10")),
        "candy_goal":         int(extract(r"- Candy goal:\s*(\d+)", "5" if "adhd" in "".join(extract_list(r"- (?:Conditions|Co-occurring):\s*(.+)")).lower() else "10")),
        "break_after":        int(extract(r"- Break after:\s*(\d+)", "10")),
        "approach":           extract(r"- Approach:\s*(.+)", "phonics"),
        "encouragement_style": extract(r"- Encouragement style:\s*(.+)", "warm"),
        "reading_stage":      int(extract(r"- Reading (?:stage|level):\s*(\d+)", "1")),
        "reading_level":      int(extract(r"- Reading (?:stage|level):\s*(\d+)", "1")),
        "mastered_words":     extract_list(r"- Mastered words:\s*(.+)"),
        "struggling_words":   extract_list(r"- Struggling with:\s*(.+)"),
        "pattern_difficulty": extract(r"- Pattern difficulty:\s*(.+)", ""),
    }

    return profile


# ─────────────────────────────────────────────
# AGENT DEFINITION
# ─────────────────────────────────────────────
profile_agent = Agent(
    name="ProfileAgent",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Loads child learning profile from Agent Skills markdown files.
        Always runs FIRST in the WordBloom pipeline before any other agent.
        The profile it returns drives every other agent's behaviour.
    """,

    instruction="""
        You are the Profile Agent for WordBloom.

        Your ONLY job:
        1. Receive a child's name
        2. Call load_child_profile() with that name
        3. Return the complete profile dict

        This profile is the foundation of the entire session.
        Every other agent reads it to adapt their behaviour.
        Return it complete — do not summarise or omit any field.
        If the profile is not found, return the error clearly.
    """,

    tools=[load_child_profile],
)
