"""Deterministic offline templates for the OfflineLLMProvider.

These are NOT meant to be the shipped story quality — that comes from the real Anthropic backend
plus heavy prompt iteration (SPEC §13.1). They exist so the pipeline runs end-to-end with no keys
and so golden tests have a stable, inspectable fixture. Content is deliberately gentle and ends
calm, and it never references any term in the bible's `avoid` list.
"""

from __future__ import annotations


def _guide(context: dict) -> dict:
    chars = context.get("canon_characters") or []
    if chars:
        return chars[0]
    return {
        "id": "companion",
        "name": "the little companion",
        "role": "guide",
        "voice_id": "warm_low",
    }


def _theme(context: dict) -> str:
    theme = (context.get("theme") or "").strip()
    if theme:
        return theme
    loved = context.get("loved_themes") or []
    return loved[0] if loved else "a quiet adventure"


def build_outline(context: dict) -> dict:
    child = context.get("child", {})
    name = child.get("name", "the child")
    guide = _guide(context)
    theme = _theme(context)
    threads = context.get("open_threads") or []
    thread_advanced = threads[0]["id"] if threads else None

    beats = [
        {"n": 1, "beat": f"{name} notices something about {theme} and grows curious.",
         "emotion": "gentle curiosity"},
        {"n": 2, "beat": f"{guide['name']} arrives and they set off together to look closer.",
         "emotion": "warm excitement"},
        {"n": 3, "beat": f"They meet a small, easy puzzle to do with {theme}.",
         "emotion": "playful wondering"},
        {"n": 4, "beat": f"{name} helps solve it by being kind and patient.",
         "emotion": "quiet pride"},
        {"n": 5, "beat": f"{guide['name']} says goodnight and {name} settles down, cozy and calm.",
         "emotion": "sleepy and safe"},
    ]
    return {
        "title": f"{name} and the {theme.title()}",
        "logline": f"A cozy bedtime visit with {guide['name']} about {theme}, ending calm.",
        "beats": beats,
        "characters": [guide["id"]],
        "thread_advanced": thread_advanced,
        "emotional_arc": "curiosity rising gently, then softening into a calm, sleepy ending",
        "ends_calm": True,
    }


def build_draft(context: dict) -> dict:
    child = context.get("child", {})
    name = child.get("name", "the child")
    guide = _guide(context)
    speaker = guide["id"].upper()
    theme = _theme(context)
    outline = context.get("outline") or {}
    title = outline.get("title", f"{name} and the {theme.title()}")

    lines = [
        f"[NARRATOR] Tonight {name} was thinking about {theme}.",
        "[SFX: soft evening breeze, 3s]",
        f"[NARRATOR] A soft sound came from nearby, and {guide['name']} peeked in.",
        f"[{speaker}] Hello, {name}. Shall we go and look, just a little?",
        f"[NARRATOR] {name} nodded, and together they went, slow and easy.",
        f"[{speaker}] Look here. Isn't {theme} lovely and quiet tonight?",
        "[SFX: gentle chimes, 2s]",
        "[NARRATOR] There was a tiny puzzle to solve, but it was a friendly one.",
        f"[{speaker}] We can do it together. Kind and slow does it.",
        f"[NARRATOR] {name} helped, patient and gentle, and the puzzle came right.",
        f"[{speaker}] You did that so kindly, {name}. Well done.",
        "[NARRATOR] Now the sky was soft and dark, and it was time to rest.",
        f"[{speaker}] Goodnight, {name}. I will be here tomorrow.",
        "[SFX: soft lullaby hum, 4s]",
        f"[NARRATOR] {name} snuggled down, warm and safe, and closed both eyes. Goodnight.",
    ]
    script_md = f"# {title}\n\n" + "\n".join(lines) + "\n"

    n = (context.get("arc_state") or {}).get("episodes_into_arc", 0) + 1
    bible_delta = {
        "new_world_facts": [f"{name} and {guide['name']} once shared a calm night about {theme}."],
        "new_characters": [],
        "new_settings": [],
        "new_open_threads": [],
        "resolved_thread_ids": [],
        "episode_summary": {
            "n": n,
            "title": title,
            "one_line": f"{name} and {guide['name']} enjoy a gentle night about {theme}.",
            "new_facts": [f"A calm memory of {theme}."],
        },
        "arc_state": None,
    }
    return {"script_md": script_md, "bible_delta": bible_delta}


def build_safety_pass() -> dict:
    return {
        "verdict": "pass",
        "age_appropriate": True,
        "violations": [],
        "ends_calm": True,
        "avoid_list_respected": True,
        "reading_level_ok": True,
    }
