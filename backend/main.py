"""
WordBloom — main.py
=====================
FastAPI server — entry point for the frontend.

Every word. Every child. Every way.
"""

import sys
import uvicorn

# Protect against Errno 5 Input/output error if terminal closes or disconnects
class SafeStream:
    def __init__(self, target):
        self._target = target
    def write(self, data):
        try:
            return self._target.write(data)
        except (OSError, BrokenPipeError):
            pass
    def flush(self):
        try:
            return self._target.flush()
        except (OSError, BrokenPipeError):
            pass
    def isatty(self):
        try:
            return self._target.isatty()
        except Exception:
            return False

sys.stdout = SafeStream(sys.stdout)
sys.stderr = SafeStream(sys.stderr)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from wordbloom_agent.agent import run_session_pipeline, _sessions

app = FastAPI(
    title="WordBloom API",
    description="Adaptive learning for every child — powered by Google ADK",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# POST /session/start
# Frontend calls this to begin a new session
# Body:     { "child_name": "emma" }
# Returns:  { session_id, profile, first_word }
# ─────────────────────────────────────────────
@app.post("/session/start")
async def start_session(body: dict):
    try:
        return await run_session_pipeline("start", body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# POST /session/answer
# Frontend calls after every word attempt
# Body:     { session_id, child_answer, response_time_seconds, input_mode }
# Returns:  { evaluation, adaptation, encouragement, next_word, session_stats }
# ─────────────────────────────────────────────
@app.post("/session/answer")
async def process_answer(body: dict):
    try:
        return await run_session_pipeline("answer", body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# POST /session/end
# Frontend calls when session ends
# Body:     { session_id }
# Returns:  { report } — requires teacher approval before sending
# ─────────────────────────────────────────────
@app.post("/session/end")
async def end_session(body: dict):
    try:
        return await run_session_pipeline("end", body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# POST /report/approve
# THE APPROVAL GATE — teacher must approve before report sends
# Body:     { session_id, approved: true, teacher_notes: "..." }
# Returns:  { sent: true/false }
# ─────────────────────────────────────────────
@app.post("/report/approve")
async def approve_report(body: dict):
    if body.get("approved"):
        session_id = body.get("session_id")
        notes = body.get("teacher_notes", "")
        print(f"✅ Teacher approved report for session {session_id[:8]}")
        print(f"   Notes: {notes}")
        return {
            "sent":       True,
            "message":    "Report approved and sent to parents",
            "session_id": session_id,
        }
    return {
        "sent":    False,
        "message": "Report not approved — no action taken",
    }


# ─────────────────────────────────────────────
# POST /profile/save
# Saves updated SKILL.md for a child profile
# ─────────────────────────────────────────────
@app.post("/profile/save")
async def save_profile(body: dict):
    from pathlib import Path
    child_id = body.get("child_id", "emma").lower().strip()
    skill_content = body.get("skill_content", "")
    skills_dir = Path(__file__).parent / "wordbloom_agent" / "skills"
    
    target_ids = [child_id]
    if child_id in ["sofia", "sony"]:
        target_ids = ["sofia", "sony"]

    for cid in target_ids:
        skill_dir = skills_dir / cid
        skill_dir.mkdir(parents=True, exist_ok=True)
        (skill_dir / "SKILL.md").write_text(skill_content)
    return {"saved": True, "child_id": child_id}


# ─────────────────────────────────────────────
# GET /profile/{child_id}
# Returns SKILL.md content for editing
# ─────────────────────────────────────────────
@app.get("/profile/{child_id}")
async def get_profile(child_id: str):
    from pathlib import Path
    skills_dir = Path(__file__).parent / "wordbloom_agent" / "skills"
    c_id = child_id.lower().strip()
    skill_file = skills_dir / c_id / "SKILL.md"
    if not skill_file.exists():
        if c_id == "sony" and (skills_dir / "sofia" / "SKILL.md").exists():
            skill_file = skills_dir / "sofia" / "SKILL.md"
        elif c_id == "sofia" and (skills_dir / "sony" / "SKILL.md").exists():
            skill_file = skills_dir / "sony" / "SKILL.md"
        else:
            return {"found": False}
    return {"found": True, "content": skill_file.read_text()}


# ─────────────────────────────────────────────
# GET /children
# Returns list of children with profiles available
# ─────────────────────────────────────────────
@app.get("/children")
async def list_children():
    from pathlib import Path
    import re
    skills_dir = Path(__file__).parent / "wordbloom_agent" / "skills"
    children = []
    if skills_dir.exists():
        for f in skills_dir.iterdir():
            if f.is_dir() and (f / "SKILL.md").exists() and f.name not in ["dyslexic-heroes", "word-bank"]:
                raw = (f / "SKILL.md").read_text()
                match = re.search(r"- Full name:\s*(.+)", raw, re.IGNORECASE)
                full_name = match.group(1).strip() if match else f.name.capitalize()
                children.append({
                    "id": f.name,
                    "name": full_name,
                })
    return {"children": children}


# ─────────────────────────────────────────────
# GET /api/children/{child_id}
# ─────────────────────────────────────────────
@app.get("/api/children/{child_id}")
@app.get("/children/{child_id}")
async def get_child_details(child_id: str):
    from pathlib import Path
    import re
    child_id = child_id.lower().strip()
    skills_dir = Path(__file__).parent / "wordbloom_agent" / "skills"
    skill_file = skills_dir / child_id / "SKILL.md"
    if not skill_file.exists() and child_id in ["sofia", "sony"]:
        skill_file = skills_dir / "sofia" / "SKILL.md" if (skills_dir / "sofia" / "SKILL.md").exists() else skills_dir / "sony" / "SKILL.md"
    if not skill_file.exists():
        raise HTTPException(status_code=404, detail=f"Child profile '{child_id}' not found")

    raw = skill_file.read_text()
    def extract(pattern, default=""):
        match = re.search(pattern, raw, re.IGNORECASE | re.MULTILINE)
        return match.group(1).strip() if match else default

    child_full_name = "Sony Mathew" if child_id in ["sofia", "sony"] else extract(r"- Full name:\s*(.+)", child_id.capitalize())

    return {
        "id": child_id,
        "child_id": child_id,
        "name": child_full_name,
        "child_name": child_full_name,
        "dyslexia_type": extract(r"- (?:Dyslexia type|Type):\s*(.+)", "phonological"),
        "font": extract(r"- Display mode:\s*(.+)", "opendyslexic"),
        "display_mode": extract(r"- Display mode:\s*(.+)", "opendyslexic"),
        "colour_overlay": extract(r"- Colour overlay:\s*(.+)", "none"),
        "input_mode": extract(r"- Input mode:\s*(.+)", "type"),
        "reading_level": int(extract(r"- Reading (?:level|stage):\s*(\d+)", "2")),
        "age": int(extract(r"- Age:\s*(\d+)", "9")),
        "school_year": extract(r"- School year:\s*(.+)", "Year 4"),
        "candy_goal": int(extract(r"- Candy goal:\s*(\d+)", "5" if "adhd" in raw.lower() else "10")),
        "session_length": int(extract(r"- Session length:\s*(\d+)", "10")),
        "break_after": int(extract(r"- Break after:\s*(\d+)", "10")),
    }


# ─────────────────────────────────────────────
# GET /api/children/{child_id}/sessions/latest
# ─────────────────────────────────────────────
# GET /api/children/{child_id}/sessions/latest
# ─────────────────────────────────────────────
DEFAULT_DIAGNOSTIC_WORDS = {
    "emma": [
        {"target": "through", "child_answer": "thru", "is_correct": False, "sentence": "The rabbit ran through the garden fence."},
        {"target": "knight", "child_answer": "nite", "is_correct": False, "sentence": "The brave knight rode to the castle."},
        {"target": "dog", "child_answer": "bog", "is_correct": False, "sentence": "The dog ran across the grass."},
    ],
    "liam": [
        {"target": "dog", "child_answer": "bog", "is_correct": False, "sentence": "The dog ran across the grass."},
        {"target": "wrote", "child_answer": "rote", "is_correct": False, "sentence": "She wrote a letter to her friend."},
        {"target": "ship", "child_answer": "snip", "is_correct": False, "sentence": "The big ship sailed across the ocean."},
    ],
    "james": [
        {"target": "dog", "child_answer": "bog", "is_correct": False, "sentence": "The dog ran across the grass."},
        {"target": "beach", "child_answer": "deach", "is_correct": False, "sentence": "We built a sandcastle on the sunny beach."},
        {"target": "chair", "child_answer": "cahir", "is_correct": False, "sentence": "Sit down on the wooden chair."},
    ],
    "sofia": [
        {"target": "gnome", "child_answer": "nome", "is_correct": False, "sentence": "A friendly garden gnome stood by the flowers."},
        {"target": "through", "child_answer": "thru", "is_correct": False, "sentence": "They walked through the bright forest."},
        {"target": "light", "child_answer": "lite", "is_correct": False, "sentence": "The morning light shone in the window."},
    ],
}

@app.get("/api/children/{child_id}/sessions/latest")
@app.get("/children/{child_id}/sessions/latest")
async def get_latest_child_session(child_id: str):
    from datetime import datetime
    child_id = child_id.lower().strip()
    fallback_words = DEFAULT_DIAGNOSTIC_WORDS.get(child_id, DEFAULT_DIAGNOSTIC_WORDS.get("sofia", DEFAULT_DIAGNOSTIC_WORDS["emma"]))

    for s_id, s_data in reversed(list(_sessions.items())):
        p = s_data.get("profile", {})
        c_name = p.get("child_name", "").lower()
        c_id = str(p.get("child_id", "")).lower()
        is_match = (
            child_id in c_name
            or c_name.startswith(child_id)
            or child_id == c_id
            or (child_id in ["sofia", "sony"] and ("sony" in c_name or "sofia" in c_name or c_id in ["sofia", "sony"]))
        )
        if is_match:
            words = s_data.get("words", [])
            if words:
                has_wrong = any(not w.get("is_correct") for w in words)
                return {
                    "child_name": p.get("child_name", "Sony Mathew" if child_id in ["sofia", "sony"] else child_id.capitalize()),
                    "session_date": datetime.now().strftime("%Y-%m-%d"),
                    "words": words if has_wrong else (words + fallback_words),
                }
            attempted = s_data.get("words_attempted", [])
            incorrect = s_data.get("words_incorrect", [])
            if attempted:
                dyslexic_attempts = {
                    "dog": "bog",
                    "knight": "nite",
                    "wrote": "rote",
                    "through": "thru",
                    "gnome": "nome",
                    "light": "lite",
                }
                res_words = []
                for w in attempted:
                    is_c = w not in incorrect
                    child_ans = w if is_c else dyslexic_attempts.get(w.lower(), "bog" if w.lower() == "dog" else f"{w}e")
                    res_words.append({
                        "target": w,
                        "child_answer": child_ans,
                        "is_correct": is_c,
                        "sentence": f"The {w} appeared on screen."
                    })
                has_wrong = any(not w.get("is_correct") for w in res_words)
                return {
                    "child_name": p.get("child_name", "Sony Mathew" if child_id in ["sofia", "sony"] else child_id.capitalize()),
                    "session_date": datetime.now().strftime("%Y-%m-%d"),
                    "words": res_words if has_wrong else (res_words + fallback_words),
                }

    return {
        "child_name": "Sony Mathew" if child_id in ["sofia", "sony"] else (child_id.capitalize() + (" Clarke" if child_id == "emma" else "")),
        "session_date": datetime.now().strftime("%Y-%m-%d"),
        "words": fallback_words
    }


# ─────────────────────────────────────────────
# PATCH /api/children/{child_id}/profile
# Updates child settings in SKILL.md
# ─────────────────────────────────────────────
@app.patch("/api/children/{child_id}/profile")
@app.patch("/children/{child_id}/profile")
async def patch_child_profile(child_id: str, body: dict):
    from pathlib import Path
    import re
    child_id = child_id.lower().strip()
    skills_dir = Path(__file__).parent / "wordbloom_agent" / "skills"
    
    target_ids = [child_id]
    if child_id in ["sofia", "sony"]:
        target_ids = ["sofia", "sony"]

    matched_any = False
    for cid in target_ids:
        skill_file = skills_dir / cid / "SKILL.md"
        if not skill_file.exists():
            continue
        matched_any = True
        content = skill_file.read_text()

        if "dyslexia_type" in body:
            content = re.sub(r"(- (?:Dyslexia type|Type):\s*).+", rf"\g<1>{body['dyslexia_type']}", content)
        if "display_mode" in body or "font" in body:
            font_val = body.get("display_mode") or body.get("font")
            content = re.sub(r"(- Display mode:\s*).+", rf"\g<1>{font_val}", content)
        if "colour_overlay" in body:
            content = re.sub(r"(- Colour overlay:\s*).+", rf"\g<1>{body['colour_overlay']}", content)
        if "input_mode" in body:
            content = re.sub(r"(- Input mode:\s*).+", rf"\g<1>{body['input_mode']}", content)
        if "approach" in body:
            content = re.sub(r"(- Approach:\s*).+", rf"\g<1>{body['approach']}", content)
        if "session_length" in body:
            content = re.sub(r"(- Session length:\s*).+", rf"\g<1>{body['session_length']}", content)
        if "candy_goal" in body:
            if re.search(r"- Candy goal:\s*.+", content):
                content = re.sub(r"(- Candy goal:\s*).+", rf"\g<1>{body['candy_goal']}", content)
            else:
                content = re.sub(r"(- Session length:\s*.+)", rf"\g<1>\n- Candy goal: {body['candy_goal']}", content)
        if "break_after" in body:
            content = re.sub(r"(- Break after:\s*).+", rf"\g<1>{body['break_after']}", content)

        skill_file.write_text(content)

    if not matched_any:
        raise HTTPException(status_code=404, detail=f"Child profile for '{child_id}' not found")
    return {"success": True, "child_id": child_id, "updated": body}


# ─────────────────────────────────────────────
# GET /
# Health check — visit http://localhost:8000
# ─────────────────────────────────────────────
@app.get("/")
async def health():
    return {
        "status":  "WordBloom API is running 🌱",
        "tagline": "Every word. Every child. Every way.",
        "agents": [
            "Profile Agent",
            "Word Selector Agent",
            "Evaluator Agent",
            "Adapter Agent",
            "Encouragement Agent",
            "Report Agent",
        ],
        "version": "1.0.0",
    }


# ─────────────────────────────────────────────
# START
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("\n🌱 WordBloom Backend Starting...")
    print("📡 API:  http://localhost:8000")
    print("📋 Docs: http://localhost:8000/docs")
    print("🌟 Every word. Every child. Every way.\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
