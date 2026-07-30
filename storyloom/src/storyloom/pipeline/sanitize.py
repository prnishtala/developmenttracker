"""Input sanitization — safety layer 1 (SPEC §7.1).

Parent-supplied names and themes are untrusted. Strip prompt-injection patterns, length-cap, and
reject non-name-like input in the name field. This is the ONE safety layer active in M1; the full
review pipeline is M2. Sanitization here is defensive, not the safety review itself.
"""

from __future__ import annotations

import re

MAX_THEME_LEN = 120
MAX_NAME_LEN = 40

# Common prompt-injection / instruction-override phrasings to neutralize in free-text input.
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|above|prior)\s+instructions", re.I),
    re.compile(r"disregard\s+(the\s+)?(system|previous)", re.I),
    re.compile(r"you\s+are\s+now\b", re.I),
    re.compile(r"new\s+instructions?\s*:", re.I),
    re.compile(r"system\s*prompt", re.I),
    re.compile(r"</?(system|assistant|user)>", re.I),
    re.compile(r"```"),
]

_NAME_RE = re.compile(rf"^[A-Za-z][A-Za-z' \-]{{0,{MAX_NAME_LEN - 1}}}$")


class InputRejected(ValueError):
    """Raised when input cannot be made safe (e.g. a non-name in the name field)."""


def sanitize_theme(theme: str) -> str:
    """Clean a parent-supplied theme string. Returns a safe, length-capped theme (may be empty)."""
    if not theme:
        return ""
    cleaned = theme.replace("\x00", " ")
    for pat in _INJECTION_PATTERNS:
        cleaned = pat.sub(" ", cleaned)
    # Collapse control chars and excess whitespace; keep ordinary punctuation.
    cleaned = re.sub(r"[\r\n\t]+", " ", cleaned)
    cleaned = re.sub(r"[^\w\s,.!'\-]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:MAX_THEME_LEN]


def validate_child_name(name: str) -> str:
    """Validate a first name. Rejects non-name-like input (SPEC §7.1)."""
    candidate = (name or "").strip()
    if not _NAME_RE.match(candidate):
        raise InputRejected(
            f"{name!r} is not a valid first name (letters, spaces, hyphens, apostrophes only)."
        )
    return candidate
