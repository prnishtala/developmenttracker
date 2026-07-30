"""Provider abstractions for LLM and TTS (SPEC §1.5).

Voice quality is the biggest quality lever and the pricing landscape moves monthly, so pipeline
logic must never import a vendor SDK directly — it goes through these protocols.
"""

from .llm import LLMProvider, get_llm_provider
from .tts import TTSProvider, get_tts_provider

__all__ = ["LLMProvider", "get_llm_provider", "TTSProvider", "get_tts_provider"]
