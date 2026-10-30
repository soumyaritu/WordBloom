"""
WordBloom — progress.py
========================
Pure code progress tracking and session summary computation.
No LLM calls or diagnostic labeling used.

Stores per-session summaries and computes previous -> current session
progress (first-try %, hints per 10 words, patterns, self-corrections, stage).
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


def _get_data_file() -> Path:
    custom_path = os.getenv("PROGRESS_DATA_PATH")
    if custom_path:
        p = Path(custom_path)
    else:
        p = Path(__file__).resolve().parent.parent / "data" / "progress.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def _normalize_pattern_key(raw_pattern: str) -> str:
    p = str(raw_pattern or "").lower().strip()
    if not p or p == "correct" or p == "none":
        return ""
    if "reversal" in p or "b/d" in p or "p/q" in p or "mirror" in p or "spatial" in p:
        return "reversal"
    if "blend" in p:
        return "blend"
    if "vowel" in p or "team" in p:
        return "vowel_team"
    if "silent" in p:
        return "silent_letter"
    if "digraph" in p:
        return "digraph"
    # Keep normalized slug
    cleaned = "".join(c if c.isalnum() else "_" for c in p)
    return cleaned.strip("_")


def _read_all_progress() -> Dict[str, List[Dict[str, Any]]]:
    file_path = _get_data_file()
    if not file_path.exists():
        return {}
    try:
        raw = file_path.read_text(encoding="utf-8")
        if not raw.strip():
            return {}
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _write_all_progress(data: Dict[str, List[Dict[str, Any]]]) -> None:
    file_path = _get_data_file()
    temp_file = file_path.with_suffix(".tmp")
    raw = json.dumps(data, indent=2, ensure_ascii=False)
    temp_file.write_text(raw, encoding="utf-8")
    temp_file.replace(file_path)


def save_session_summary(child_id: str, session_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stores one summary per finished session:
    ended_at, words_attempted, first_try_correct, hints_used, self_corrections,
    pattern_counts (e.g. reversal, blend, vowel_team, silent_letter), stage_at_end.
    """
    cid = str(child_id or "emma").lower().strip().split()[0]
    ended_at = datetime.now(timezone.utc).isoformat()

    words_attempts = session_data.get("words", [])
    raw_patterns = list(session_data.get("error_patterns", []))

    # Parse word attempts in sequential order
    attempts_by_target: Dict[str, List[Dict[str, Any]]] = {}
    if isinstance(words_attempts, list):
        for att in words_attempts:
            if isinstance(att, dict):
                target = str(att.get("target") or att.get("word") or "").lower().strip()
                if target:
                    attempts_by_target.setdefault(target, []).append(att)
                    pat = att.get("error_pattern") or att.get("pattern")
                    if pat and not att.get("is_correct"):
                        raw_patterns.append(str(pat))

    first_try_correct = 0
    self_corrections = 0
    hints_used = 0

    if attempts_by_target:
        words_attempted = len(attempts_by_target)
        for target, attempts in attempts_by_target.items():
            if not attempts:
                continue
            first_attempt = attempts[0]
            if first_attempt.get("is_correct"):
                first_try_correct += 1
            else:
                # If first attempt was wrong and any subsequent attempt was correct -> self-correction
                if any(bool(a.get("is_correct")) for a in attempts[1:]):
                    self_corrections += 1
                # If word required multiple attempts or was flagged with hints
                if len(attempts) > 1:
                    hints_used += 1
    else:
        # Fallback if raw attempts are passed as pre-computed counts
        words_attempted = int(session_data.get("words_attempted") if isinstance(session_data.get("words_attempted"), (int, float))
                              else len(session_data.get("words_attempted", [])))
        first_try_correct = int(session_data.get("first_try_correct", len(session_data.get("words_correct", []))))
        self_corrections = int(session_data.get("self_corrections", 0))
        hints_used = int(session_data.get("hints_used", len(session_data.get("words_with_hints", []))))

    # Incorporate words_with_hints if passed as set/list
    explicit_hints = session_data.get("words_with_hints")
    if isinstance(explicit_hints, (set, list)):
        hints_used = max(hints_used, len(explicit_hints))
    elif isinstance(session_data.get("hints_used"), (int, float)):
        hints_used = int(session_data.get("hints_used"))

    if isinstance(session_data.get("first_try_correct"), (int, float)):
        first_try_correct = int(session_data.get("first_try_correct"))
    if isinstance(session_data.get("self_corrections"), (int, float)):
        self_corrections = int(session_data.get("self_corrections"))
    if isinstance(session_data.get("words_attempted"), (int, float)):
        words_attempted = int(session_data.get("words_attempted"))

    # Count patterns
    pattern_counts: Dict[str, int] = {
        "reversal": 0,
        "blend": 0,
        "vowel_team": 0,
        "silent_letter": 0,
    }

    if isinstance(session_data.get("pattern_counts"), dict):
        for k, v in session_data["pattern_counts"].items():
            norm_k = _normalize_pattern_key(k) or k
            pattern_counts[norm_k] = pattern_counts.get(norm_k, 0) + int(v)
    else:
        for p in raw_patterns:
            norm = _normalize_pattern_key(p)
            if norm:
                pattern_counts[norm] = pattern_counts.get(norm, 0) + 1

    profile = session_data.get("profile", {})
    if isinstance(profile, dict):
        stage_at_end = int(profile.get("reading_stage") or profile.get("reading_level") or session_data.get("stage_at_end") or 1)
    else:
        stage_at_end = int(session_data.get("stage_at_end", 1))

    summary = {
        "ended_at": ended_at,
        "words_attempted": max(0, words_attempted),
        "first_try_correct": max(0, min(first_try_correct, words_attempted if words_attempted > 0 else first_try_correct)),
        "hints_used": max(0, hints_used),
        "self_corrections": max(0, self_corrections),
        "pattern_counts": pattern_counts,
        "stage_at_end": stage_at_end,
    }

    data = _read_all_progress()
    data.setdefault(cid, []).append(summary)
    _write_all_progress(data)

    return summary


def compute_progress(child_id: str) -> Dict[str, Any]:
    """
    Compares the latest session with the previous one and returns
    previous -> current for: first-try %, hints per 10 words, each pattern count,
    self-corrections, stage. Also returns the last 5 sessions' first-try % and hints.
    With fewer than 2 sessions, returns {"status": "not_enough_sessions"}.
    Never invents a baseline. Safely handles zero words.
    """
    cid = str(child_id or "emma").lower().strip().split()[0]
    data = _read_all_progress()
    sessions = data.get(cid, [])

    if len(sessions) < 2:
        return {
            "status": "not_enough_sessions",
            "child_id": cid,
            "session_count": len(sessions),
            "message": "Progress appears after 2 sessions.",
        }

    prev = sessions[-2]
    curr = sessions[-1]

    # Calculate first-try percentage (avoid divide-by-zero)
    prev_w = max(0, prev.get("words_attempted", 0))
    curr_w = max(0, curr.get("words_attempted", 0))

    prev_ft = max(0, prev.get("first_try_correct", 0))
    curr_ft = max(0, curr.get("first_try_correct", 0))

    prev_ft_pct = round((prev_ft / prev_w * 100), 1) if prev_w > 0 else 0.0
    curr_ft_pct = round((curr_ft / curr_w * 100), 1) if curr_w > 0 else 0.0

    # Calculate hints per 10 words
    prev_h = max(0, prev.get("hints_used", 0))
    curr_h = max(0, curr.get("hints_used", 0))

    prev_hints_per_10 = round((prev_h / prev_w * 10), 1) if prev_w > 0 else 0.0
    curr_hints_per_10 = round((curr_h / curr_w * 10), 1) if curr_w > 0 else 0.0

    # Self corrections
    prev_sc = max(0, prev.get("self_corrections", 0))
    curr_sc = max(0, curr.get("self_corrections", 0))

    # Stage
    prev_stage = prev.get("stage_at_end", 1)
    curr_stage = curr.get("stage_at_end", 1)

    # Patterns comparison
    prev_patterns: Dict[str, int] = prev.get("pattern_counts", {})
    curr_patterns: Dict[str, int] = curr.get("pattern_counts", {})
    all_pattern_keys = sorted(list(set(list(prev_patterns.keys()) + list(curr_patterns.keys()))))

    pattern_comparisons: Dict[str, Dict[str, Any]] = {}
    for p_key in all_pattern_keys:
        p_prev = int(prev_patterns.get(p_key, 0))
        p_curr = int(curr_patterns.get(p_key, 0))
        diff = p_curr - p_prev

        if diff < 0:
            word_descriptor = "fewer"
        elif diff > 0:
            word_descriptor = "worth practising"
        else:
            word_descriptor = "same"

        pattern_comparisons[p_key] = {
            "previous": p_prev,
            "current": p_curr,
            "change": diff,
            "descriptor": word_descriptor,
        }

    # First-try descriptor
    ft_diff = round(curr_ft_pct - prev_ft_pct, 1)
    if ft_diff > 0:
        ft_desc = "more"
    elif ft_diff < 0:
        ft_desc = "worth practising"
    else:
        ft_desc = "same"

    # Hints descriptor (fewer hints is good)
    hints_diff = round(curr_hints_per_10 - prev_hints_per_10, 1)
    if hints_diff < 0:
        hints_desc = "fewer"
    elif hints_diff > 0:
        hints_desc = "worth practising"
    else:
        hints_desc = "same"

    # Self-corrections descriptor
    sc_diff = curr_sc - prev_sc
    if sc_diff > 0:
        sc_desc = "more"
    elif sc_diff < 0:
        sc_desc = "fewer"
    else:
        sc_desc = "same"

    # Stage descriptor
    stage_diff = curr_stage - prev_stage
    if stage_diff > 0:
        stage_desc = "advanced"
    elif stage_diff < 0:
        stage_desc = "consolidating"
    else:
        stage_desc = "steady"

    # History of last 5 sessions
    last_5 = sessions[-5:]
    history: List[Dict[str, Any]] = []
    for idx, s in enumerate(last_5, 1):
        sw = max(0, s.get("words_attempted", 0))
        s_ft = max(0, s.get("first_try_correct", 0))
        s_h = max(0, s.get("hints_used", 0))
        history.append({
            "session_number": idx,
            "ended_at": s.get("ended_at", ""),
            "first_try_percent": round((s_ft / sw * 100), 1) if sw > 0 else 0.0,
            "hints_per_10": round((s_h / sw * 10), 1) if sw > 0 else 0.0,
            "words_attempted": sw,
            "self_corrections": s.get("self_corrections", 0),
            "stage": s.get("stage_at_end", 1),
        })

    return {
        "status": "ok",
        "child_id": cid,
        "total_sessions": len(sessions),
        "comparison": {
            "first_try_percent": {
                "previous": prev_ft_pct,
                "current": curr_ft_pct,
                "change": ft_diff,
                "descriptor": ft_desc,
            },
            "hints_per_10": {
                "previous": prev_hints_per_10,
                "current": curr_hints_per_10,
                "change": hints_diff,
                "descriptor": hints_desc,
            },
            "self_corrections": {
                "previous": prev_sc,
                "current": curr_sc,
                "change": sc_diff,
                "descriptor": sc_desc,
            },
            "stage": {
                "previous": prev_stage,
                "current": curr_stage,
                "change": stage_diff,
                "descriptor": stage_desc,
            },
            "patterns": pattern_comparisons,
        },
        "history": history,
    }
