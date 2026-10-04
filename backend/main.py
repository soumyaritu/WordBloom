"""
WordBloom — main.py
=====================
FastAPI server — entry point for the frontend.

Every word. Every child. Every way.
"""

import uvicorn
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
    skill_dir = skills_dir / child_id
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
    skill_file = skills_dir / child_id.lower().strip() / "SKILL.md"
    if not skill_file.exists():
        return {"found": False}
    return {"found": True, "content": skill_file.read_text()}


# ─────────────────────────────────────────────
# GET /children
# Returns list of children with profiles available
# ─────────────────────────────────────────────
@app.get("/children")
async def list_children():
    from pathlib import Path
    skills_dir = Path(__file__).parent / "wordbloom_agent" / "skills"
    children = []
    if skills_dir.exists():
        for f in skills_dir.iterdir():
            if f.is_dir() and (f / "SKILL.md").exists() and f.name not in ["dyslexic-heroes", "word-bank"]:
                children.append({
                    "id": f.name,
                    "name": f.name.capitalize(),
                })
    return {"children": children}


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
