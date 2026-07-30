"""Load and render versioned prompt files (SPEC §3: prompts live in .md files, never inline).

Each prompt file has a `# System` section and a `# User` section. `{{var}}` placeholders are filled
from kwargs. Keeping these in files means prompt changes are diffable and testable against goldens.
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"


@lru_cache(maxsize=32)
def _read(name: str, version: str) -> str:
    path = PROMPTS_DIR / f"{name}.{version}.md"
    if not path.exists():
        raise FileNotFoundError(f"Prompt not found: {path}")
    return path.read_text(encoding="utf-8")


def _split_sections(text: str) -> tuple[str, str]:
    # Strip HTML comments (used for maintainer notes at the top of each file).
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    parts = re.split(r"^#\s*User\s*$", text, maxsplit=1, flags=re.MULTILINE)
    if len(parts) != 2:
        raise ValueError("Prompt must contain a '# User' section")
    system = re.sub(r"^#\s*System\s*$", "", parts[0], flags=re.MULTILINE).strip()
    user = parts[1].strip()
    return system, user


def _render(template: str, **kwargs) -> str:
    def repl(m: re.Match) -> str:
        key = m.group(1).strip()
        return str(kwargs.get(key, m.group(0)))

    return re.sub(r"\{\{\s*(\w+)\s*\}\}", repl, template)


def load_prompt(name: str, version: str = "v1", **kwargs) -> tuple[str, str]:
    """Return (system, user) for a prompt, with `{{var}}` placeholders rendered."""
    system, user = _split_sections(_read(name, version))
    return _render(system, **kwargs), _render(user, **kwargs)
