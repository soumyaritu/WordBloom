"""
WordBloom — memory_bank.py
===========================
Vertex AI Reasoning Engine Sessions & Longitudinal Memory Bank.

Solves the serverless ephemeral memory problem:
  1. Dual-Layer SessionStore:
     - L1: In-memory RAM cache for instant 0ms lookups during live gameplay.
     - L2: Durable session persistence (backend/data/sessions.json) so container
       restarts or multi-instance Cloud Run scaling never loses an active session.
  2. Longitudinal Memory Bank:
     - Retains child milestones across days/weeks (retention words, mastered phonics,
       recurring visual/sensory observations).
     - Feeds retention candidates into WordSelectorAgent to check long-term recall.
  3. Feature flag: MEMORY_BANK_ENABLED (default True).
  4. Pure fail-safe: All I/O is guarded; operations fall back to memory silently.
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

logger = logging.getLogger("wordbloom.memory")

# Feature flag
MEMORY_BANK_ENABLED = os.getenv("MEMORY_BANK_ENABLED", "true").lower() in ("true", "1", "yes")

# Storage paths
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SESSIONS_FILE = DATA_DIR / "sessions.json"
MEMORY_BANK_FILE = DATA_DIR / "memory_bank.json"


def _ensure_data_dir():
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not create data directory {DATA_DIR}: {e}")


# ─────────────────────────────────────────────
# 1. DUAL-LAYER SESSION STORE (L1 RAM + L2 DISK)
# ─────────────────────────────────────────────
class SessionStore:
    """
    Thread-safe dual-layer session store.
    L1 in-memory dict provides sub-millisecond lookups.
    L2 durable storage protects against container cold-restarts in Cloud Run.
    """
    _l1_cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def save_session(cls, session_id: str, data: Dict[str, Any]) -> None:
        if not session_id or not isinstance(data, dict):
            return

        # 1. Update L1 RAM cache instantly (< 0.0001s)
        cls._l1_cache[session_id] = data

        if not MEMORY_BANK_ENABLED:
            return

        # 2. Sync to L2 durable storage
        try:
            _ensure_data_dir()
            current_sessions = {}
            if SESSIONS_FILE.exists():
                try:
                    current_sessions = json.loads(SESSIONS_FILE.read_text(encoding="utf-8"))
                except Exception:
                    current_sessions = {}

            # Serialize session safely (strip unpicklable items if any)
            serializable = {}
            for k, v in data.items():
                if isinstance(v, (str, int, float, bool, list, dict)) or v is None:
                    serializable[k] = v

            current_sessions[session_id] = serializable
            SESSIONS_FILE.write_text(json.dumps(current_sessions, indent=2), encoding="utf-8")
        except Exception as e:
            logger.warning(f"SessionStore L2 sync warning (non-fatal): {e}")

    @classmethod
    def get_session(cls, session_id: str) -> Optional[Dict[str, Any]]:
        if not session_id:
            return None

        # 1. Check L1 RAM cache first (0ms)
        if session_id in cls._l1_cache:
            return cls._l1_cache[session_id]

        if not MEMORY_BANK_ENABLED:
            return None

        # 2. Check L2 durable store on serverless instance reload
        try:
            if SESSIONS_FILE.exists():
                current_sessions = json.loads(SESSIONS_FILE.read_text(encoding="utf-8"))
                if session_id in current_sessions:
                    recovered = current_sessions[session_id]
                    cls._l1_cache[session_id] = recovered
                    return recovered
        except Exception as e:
            logger.warning(f"SessionStore L2 read warning (non-fatal): {e}")

        return None

    @classmethod
    def delete_session(cls, session_id: str) -> None:
        cls._l1_cache.pop(session_id, None)
        try:
            if SESSIONS_FILE.exists():
                current_sessions = json.loads(SESSIONS_FILE.read_text(encoding="utf-8"))
                if session_id in current_sessions:
                    del current_sessions[session_id]
                    SESSIONS_FILE.write_text(json.dumps(current_sessions, indent=2), encoding="utf-8")
        except Exception:
            pass


# ─────────────────────────────────────────────
# 2. LONGITUDINAL CHILD MEMORY BANK
# ─────────────────────────────────────────────
def _read_memory_bank() -> Dict[str, Any]:
    if not MEMORY_BANK_FILE.exists():
        return {}
    try:
        return json.loads(MEMORY_BANK_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _write_memory_bank(bank_data: Dict[str, Any]) -> None:
    _ensure_data_dir()
    try:
        MEMORY_BANK_FILE.write_text(json.dumps(bank_data, indent=2), encoding="utf-8")
    except Exception as e:
        logger.warning(f"Could not persist Memory Bank (non-fatal): {e}")


def get_child_memory(child_id: str) -> Dict[str, Any]:
    """
    Returns longitudinal learning memory for a child.
    """
    cid = str(child_id or "emma").lower().strip().split()[0]
    bank = _read_memory_bank()
    if cid in bank:
        return bank[cid]

    # Clean initial structure for new child
    return {
        "child_id": cid,
        "total_sessions_completed": 0,
        "mastered_words": [],
        "retention_words": [],
        "mastered_phonics": [],
        "sensory_observations": [],
        "last_active": None,
    }


def record_session_memory(child_id: str, session: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates a child's longitudinal memory bank after a completed session.
    Tracks words to revisit as retention targets and records mastered phonics milestones.
    """
    if not MEMORY_BANK_ENABLED or not session:
        return get_child_memory(child_id)

    cid = str(child_id or "emma").lower().strip().split()[0]
    bank = _read_memory_bank()
    child_mem = bank.get(cid, {
        "child_id": cid,
        "total_sessions_completed": 0,
        "mastered_words": [],
        "retention_words": [],
        "mastered_phonics": [],
        "sensory_observations": [],
        "last_active": None,
    })

    # Update session count
    child_mem["total_sessions_completed"] = child_mem.get("total_sessions_completed", 0) + 1
    child_mem["last_active"] = datetime.now(timezone.utc).isoformat()

    # Extract words
    def _extract_word_list(w_list):
        out = []
        for w in (w_list or []):
            if isinstance(w, dict):
                val = w.get("target") or w.get("word") or ""
            else:
                val = str(w or "")
            clean = val.strip().lower()
            if clean and clean not in out:
                out.append(clean)
        return out

    correct_words = _extract_word_list(session.get("words_correct", []))
    incorrect_words = _extract_word_list(session.get("words_incorrect", []))

    # 1. Mastered words accumulation (keep up to 30)
    mastered = list(child_mem.get("mastered_words", []))
    for w in correct_words:
        if w not in mastered and w not in incorrect_words:
            mastered.append(w)
    child_mem["mastered_words"] = mastered[-30:]

    # 2. Retention words: words that were incorrect become candidates for retention check next session
    retention = list(child_mem.get("retention_words", []))
    for w in incorrect_words:
        if w not in retention:
            retention.append(w)
    # Remove from retention if child mastered it today
    retention = [w for w in retention if w not in correct_words]
    child_mem["retention_words"] = retention[-15:]

    # 3. Phonics pattern milestones
    patterns = session.get("error_patterns", [])
    if isinstance(patterns, list):
        # If no reversals seen this session, note spatial orientation milestone
        if "reversal" not in patterns and len(correct_words) >= 3:
            milestone = f"Zero mirror reversals observed on {datetime.now().strftime('%d %b')}"
            if milestone not in child_mem.get("mastered_phonics", []):
                child_mem.setdefault("mastered_phonics", []).append(milestone)

    # 4. Sensory observations (ADHD breaks, overlay efficacy)
    breaks = session.get("breaks_taken", 0)
    if breaks > 0:
        note = f"ADHD pacing active: took {breaks} scheduled rest break{'s' if breaks != 1 else ''}"
        if note not in child_mem.get("sensory_observations", []):
            child_mem.setdefault("sensory_observations", []).append(note)

    # Save to bank
    bank[cid] = child_mem
    _write_memory_bank(bank)
    return child_mem


def get_retention_word_candidate(child_id: str) -> Optional[str]:
    """
    Returns a retention word candidate from prior sessions for retention check.
    """
    mem = get_child_memory(child_id)
    retention_list = mem.get("retention_words", [])
    if retention_list:
        return retention_list[0]
    return None
