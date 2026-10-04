"""
WordBloom — agent.py
======================
Root Orchestrator — manages the full 6-agent pipeline.

Pipeline:
  run_session_pipeline("start")
      ↓
  Profile Agent       → loads child profile from Agent Skills
      ↓
  Word Selector Agent → picks right word for this child
      ↓
  Evaluator Agent     → scores the child's answer
      ↓
  Adapter Agent       → decides next action
      ↓
  Encouragement Agent → generates motivational message
      ↓
  Report Agent        → session summary (teacher approval required)
"""

import os
import uuid
import asyncio
import vertexai
from google import genai
from google.adk.agents import Agent
from dotenv import load_dotenv

from wordbloom_agent.profile_agent      import load_child_profile
from wordbloom_agent.word_selector_agent import select_next_word, _instant_select_word
from wordbloom_agent.evaluator_agent    import evaluate_answer
from wordbloom_agent.adapter_agent      import decide_adaptation
from wordbloom_agent.encouragement_agent import generate_encouragement
from wordbloom_agent.report_agent       import generate_session_report

from wordbloom_agent.profile_agent       import profile_agent
from wordbloom_agent.word_selector_agent import word_selector_agent
from wordbloom_agent.evaluator_agent     import evaluator_agent
from wordbloom_agent.adapter_agent       import adapter_agent
from wordbloom_agent.encouragement_agent import encouragement_agent
from wordbloom_agent.report_agent        import report_agent

load_dotenv()

vertexai.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
)

# ─────────────────────────────────────────────
# SESSION STORE — in-memory for demo
# In production: replace with SQLite or Cloud Storage
# ─────────────────────────────────────────────
_sessions = {}


# ─────────────────────────────────────────────
# ROOT ORCHESTRATOR
# ─────────────────────────────────────────────
root_agent = Agent(
    name="WordBloomOrchestrator",
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),

    description="""
        Root orchestrator for WordBloom adaptive learning system.
        Coordinates 6 specialist agents to deliver personalised reading
        sessions for every child regardless of learning difference.
    """,

    instruction="""
        You are the WordBloom root orchestrator.
        You coordinate 6 specialist agents in sequence.

        For a new session (action=start):
        1. Call Profile Agent to load child's skill file
        2. Call Word Selector Agent to get first word
        3. Return profile + first word to the app

        For each answer (action=answer):
        1. Call Evaluator Agent to score the answer
        2. Call Adapter Agent to decide next action
        3. Call Encouragement Agent to generate message
        4. If continuing: Call Word Selector Agent for next word
        5. Return all results to the app

        For session end (action=end):
        1. Call Report Agent to generate teacher report
        2. Return report with approval_required=True
        3. Nothing sends until teacher approves

        NEVER skip an agent.
        NEVER send a report without teacher approval.
        Every child deserves the full pipeline.
    """,

    tools=[
        load_child_profile,
        select_next_word,
        evaluate_answer,
        decide_adaptation,
        generate_encouragement,
        generate_session_report,
    ],

    sub_agents=[
        profile_agent,
        word_selector_agent,
        evaluator_agent,
        adapter_agent,
        encouragement_agent,
        report_agent,
    ],
)


# ─────────────────────────────────────────────
# PIPELINE ENTRY POINT
# Called by main.py for every request
# ─────────────────────────────────────────────
async def run_session_pipeline(action: str, body: dict) -> dict:
    """
    Main entry point — runs the right agents for each action.

    Actions:
        start  — new session, load profile, get first word
        answer — process child answer, get next word
        end    — generate teacher report
    """

    # ── START ─────────────────────────────────
    if action == "start":
        child_name = body.get("child_name", "emma")
        session_id = str(uuid.uuid4())

        print(f"\n{'='*50}")
        print(f"🌱 WordBloom session starting for: {child_name}")
        print(f"{'='*50}")

        # Agent 1 — Profile
        print("👤 Profile Agent: loading skill file...")
        profile = load_child_profile(child_name)
        print(f"   ✅ {profile.get('child_name')} — {profile.get('dyslexia_type')} dyslexia")

        # Agent 2 — First word (Instant selector <0.001s)
        print("📖 Word Selector Agent: selecting first word...")
        first_word = _instant_select_word(
            reading_level           = profile.get("reading_level", 1),
            struggling_words        = profile.get("struggling_words", []),
            mastered_words          = profile.get("mastered_words", []),
            words_done_this_session = [],
            last_answer_correct     = True,
            consecutive_wrong       = 0,
        )
        print(f"   ✅ First word: {first_word.get('word')}")

        # Store session
        _sessions[session_id] = {
            "profile":            profile,
            "words_attempted":    [],
            "words_correct":      [],
            "words_incorrect":    [],
            "adapter_actions":    [],
            "error_patterns":     [],
            "encouragements":     [],
            "breaks_taken":       0,
            "consecutive_correct": 0,
            "consecutive_wrong":   0,
            "current_word":       first_word,
            "start_time":         __import__("time").time(),
        }

        return {
            "session_id": session_id,
            "profile":    profile,
            "first_word": first_word,
            "success":    True,
        }

    # ── ANSWER ────────────────────────────────
    elif action == "answer":
        session_id = body.get("session_id")
        session    = _sessions.get(session_id)
        if not session:
            # Auto-recover session if server reloaded or session expired
            child_name = body.get("child_name", "emma")
            profile = load_child_profile(child_name)
            first_word = _instant_select_word(
                reading_level           = profile.get("reading_level", 1),
                struggling_words        = profile.get("struggling_words", []),
                mastered_words          = profile.get("mastered_words", []),
                words_done_this_session = [],
                last_answer_correct     = True,
                consecutive_wrong       = 0,
            )
            session = {
                "profile":            profile,
                "words_attempted":    [],
                "words_correct":      [],
                "words_incorrect":    [],
                "adapter_actions":    [],
                "error_patterns":     [],
                "encouragements":     [],
                "breaks_taken":       0,
                "consecutive_correct": 0,
                "consecutive_wrong":   0,
                "current_word":       first_word,
                "start_time":         __import__("time").time(),
            }
            if session_id:
                _sessions[session_id] = session

        profile      = session.get("profile", {})
        current_word = session.get("current_word", {})

        print(f"\n📝 Processing answer for session {str(session_id)[:8]}...")

        # Agent 3 — Evaluate
        print("🔍 Evaluator Agent: scoring answer...")
        evaluation = evaluate_answer(
            correct_word           = current_word.get("word", ""),
            child_answer           = body.get("child_answer", ""),
            response_time_seconds  = body.get("response_time_seconds", 5.0),
            input_mode             = body.get("input_mode", profile.get("input_mode", "type")),
            attempt_number         = body.get("attempt_number", 1),
            typical_response_time  = 5.0,
        )

        # Update session stats
        word = current_word.get("word", "")
        session["words_attempted"].append(word)
        if evaluation.get("is_correct"):
            session["words_correct"].append(word)
            session["consecutive_correct"] += 1
            session["consecutive_wrong"]    = 0
        else:
            session["words_incorrect"].append(word)
            session["consecutive_wrong"]   += 1
            session["consecutive_correct"]  = 0

        pattern = evaluation.get("error_pattern", "")
        if pattern and pattern != "correct":
            session["error_patterns"].append(pattern)

        elapsed = (__import__("time").time() - session["start_time"]) / 60

        # Agent 4 — Adapt
        print("⚡ Adapter Agent: deciding next action...")
        adaptation = decide_adaptation(
            is_correct           = evaluation.get("is_correct", False),
            partial_score        = evaluation.get("partial_score", 0),
            confidence_signal    = evaluation.get("confidence_signal", "normal"),
            needs_break          = evaluation.get("needs_break", False),
            error_pattern        = evaluation.get("error_pattern", ""),
            dyslexia_type        = profile.get("dyslexia_type", "phonological"),
            co_occurring         = profile.get("co_occurring", []),
            words_done           = len(set(session["words_attempted"])),
            break_after          = profile.get("break_after", 10),
            session_length_mins  = profile.get("session_length", 10),
            time_elapsed_mins    = elapsed,
            consecutive_correct  = session["consecutive_correct"],
            consecutive_wrong    = session["consecutive_wrong"],
            current_level        = profile.get("reading_level", 1),
        )

        session["adapter_actions"].append(adaptation.get("action", "continue"))
        if adaptation.get("action") == "take_break":
            session["breaks_taken"] += 1

        # Agent 5 & Agent 2 — Encouragement + Next Word in Parallel
        print("💚 Encouragement Agent & 📖 Word Selector Agent: running in parallel...")
        encouragement_task = asyncio.to_thread(
            generate_encouragement,
            is_correct           = evaluation.get("is_correct", False),
            partial_score        = evaluation.get("partial_score", 0),
            letters_correct      = evaluation.get("letters_correct", 0),
            letters_total        = evaluation.get("letters_total", 1),
            positive_observation = evaluation.get("positive_observation", ""),
            word                 = word,
            encouragement_style  = profile.get("encouragement_style", "warm"),
            co_occurring         = profile.get("co_occurring", []),
            words_done_today     = len(session["words_attempted"]),
            words_correct_today  = len(session["words_correct"]),
            session_streak       = session["consecutive_correct"],
        )

        next_word = None
        if not adaptation.get("session_over"):
            next_word_task = asyncio.to_thread(
                select_next_word,
                dyslexia_type           = profile.get("dyslexia_type", "phonological"),
                reading_level           = profile.get("reading_level", 1) + adaptation.get("level_change", 0),
                approach                = profile.get("approach", "phonics"),
                struggling_words        = profile.get("struggling_words", []),
                mastered_words          = profile.get("mastered_words", []),
                words_done_this_session = session["words_attempted"],
                last_answer_correct     = evaluation.get("is_correct", False),
                consecutive_correct     = session["consecutive_correct"],
                consecutive_wrong       = session["consecutive_wrong"],
            )
            encouragement, next_word = await asyncio.gather(encouragement_task, next_word_task)
            session["current_word"] = next_word
        else:
            encouragement = await encouragement_task

        session["encouragements"].append(encouragement.get("message", ""))

        print(f"   ✅ Complete — action: {adaptation.get('action')}")

        return {
            "evaluation":    evaluation,
            "adaptation":    adaptation,
            "encouragement": encouragement,
            "next_word":     next_word,
            "session_stats": {
                "words_done":     len(session["words_attempted"]),
                "words_correct":  len(session["words_correct"]),
                "accuracy":       round(len(session["words_correct"]) / max(len(session["words_attempted"]), 1) * 100),
                "breaks_taken":   session["breaks_taken"],
                "time_elapsed":   round(elapsed, 1),
            },
            "success": True,
        }

    # ── END ───────────────────────────────────
    elif action == "end":
        session_id = body.get("session_id")
        session    = _sessions.get(session_id, {})
        profile    = session.get("profile", {})

        elapsed = (__import__("time").time() - session.get("start_time", __import__("time").time())) / 60

        print(f"\n📋 Report Agent: generating session report...")
        report = generate_session_report(
            child_name            = profile.get("child_name", "Child"),
            dyslexia_type         = profile.get("dyslexia_type", "phonological"),
            reading_level         = profile.get("reading_level", 1),
            session_duration_mins = elapsed,
            words_attempted       = session.get("words_attempted", []),
            words_correct         = session.get("words_correct", []),
            words_incorrect       = session.get("words_incorrect", []),
            adapter_actions       = session.get("adapter_actions", []),
            error_patterns        = session.get("error_patterns", []),
            encouragement_messages= session.get("encouragements", []),
            breaks_taken          = session.get("breaks_taken", 0),
        )

        print(f"   ✅ Report ready — awaiting teacher approval")
        return {"report": report, "success": True}

    return {"error": "Unknown action", "success": False}
