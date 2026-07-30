"""LLMProvider protocol + implementations (SPEC §1.5, §2).

- `AnthropicLLMProvider`: real, structured-JSON output via the Anthropic API.
- `OfflineLLMProvider`: deterministic template generator. No network, no key. Lets the entire
  pipeline run in CI and on a laptop with zero spend, and gives golden tests a stable fixture.

Stages call `generate_json(task=..., ...)`. The `task` label lets the offline backend dispatch to
the right template; the Anthropic backend uses it only for logging.
"""

from __future__ import annotations

import json
import re
from typing import Protocol, runtime_checkable

from ..config import Settings, get_settings
from ..pipeline.types import LLMResult, LLMUsage
from . import _offline_templates as tmpl


@runtime_checkable
class LLMProvider(Protocol):
    name: str

    def generate_json(
        self,
        *,
        task: str,
        system: str,
        user: str,
        context: dict,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> LLMResult:
        """Return structured JSON as a dict, plus token usage."""
        ...


class OfflineLLMProvider:
    """Deterministic, network-free generator used for dev, CI, and golden tests."""

    name = "offline"

    def generate_json(
        self,
        *,
        task: str,
        system: str,
        user: str,
        context: dict,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> LLMResult:
        if task == "outline":
            data = tmpl.build_outline(context)
        elif task == "draft":
            data = tmpl.build_draft(context)
        elif task == "continuity":
            data = {"contradictions": []}  # offline drafts never contradict the bible
        elif task == "safety":
            # M1: safety is a stubbed pass-through anyway (see stages/safety.py).
            data = tmpl.build_safety_pass()
        else:  # pragma: no cover - defensive
            raise ValueError(f"OfflineLLMProvider has no template for task {task!r}")

        # Rough token accounting so the cost model (SPEC §10) has real numbers even offline.
        out_tokens = max(1, len(json.dumps(data)) // 4)
        in_tokens = max(1, (len(system) + len(user)) // 4)
        return LLMResult(
            data=data,
            usage=LLMUsage(input_tokens=in_tokens, output_tokens=out_tokens),
            model="offline",
        )


class AnthropicLLMProvider:
    """Real Anthropic API backend with structured JSON output."""

    name = "anthropic"

    def __init__(self, settings: Settings):
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "STORYLOOM_ANTHROPIC_API_KEY is required for --llm anthropic. "
                "Set it in .env, or use --llm offline."
            )
        # Import lazily so the package works without the SDK installed / no key present.
        import anthropic

        self._client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self._model = settings.anthropic_model

    def generate_json(
        self,
        *,
        task: str,
        system: str,
        user: str,
        context: dict,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> LLMResult:
        # The prompt files instruct the model to reply with a single JSON object. We serialize the
        # selected bible context into the user turn so the model has everything it needs.
        user_full = f"{user}\n\n<context>\n{json.dumps(context, ensure_ascii=False)}\n</context>"
        resp = self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": user_full}],
        )
        text = "".join(
            block.text for block in resp.content if getattr(block, "type", None) == "text"
        )
        data = _extract_json(text)
        usage = LLMUsage(
            input_tokens=getattr(resp.usage, "input_tokens", 0),
            output_tokens=getattr(resp.usage, "output_tokens", 0),
        )
        return LLMResult(data=data, usage=usage, model=self._model)


def _extract_json(text: str) -> dict:
    """Pull the first JSON object out of a model reply, tolerating markdown fences."""
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else text
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object found in LLM response: {text[:200]!r}")
    return json.loads(candidate[start : end + 1])


def get_llm_provider(settings: Settings | None = None, override: str | None = None) -> LLMProvider:
    settings = settings or get_settings()
    provider = (override or settings.llm_provider).lower()
    if provider == "offline":
        return OfflineLLMProvider()
    if provider == "anthropic":
        return AnthropicLLMProvider(settings)
    raise ValueError(f"Unknown LLM provider {provider!r} (expected 'offline' or 'anthropic')")
