"""Central configuration. All environment access lives here (SPEC §3).

Uses pydantic-settings so every knob is env-driven and typed. Import `get_settings()` rather than
reading os.environ anywhere else in the codebase.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="STORYLOOM_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Providers -----------------------------------------------------------
    llm_provider: str = "offline"  # offline | anthropic
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-4-5-20250929"

    tts_provider: str = "offline"  # offline | elevenlabs | openai
    elevenlabs_api_key: str | None = None
    elevenlabs_model: str = "eleven_multilingual_v2"
    openai_api_key: str | None = None
    openai_tts_model: str = "tts-1-hd"

    # --- Audio / mastering ---------------------------------------------------
    music_bed_path: Path | None = None
    target_lufs: float = -16.0
    target_true_peak: float = -1.0
    mp3_bitrate: str = "112k"
    ffmpeg_bin: str | None = None  # auto-resolved if empty

    # --- Infrastructure (unused in M1) --------------------------------------
    database_url: str = (
        "postgresql+psycopg://storyloom:storyloom@localhost:5432/storyloom"
    )
    redis_url: str = "redis://localhost:6379/0"
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "storyloom"
    s3_secret_key: str = "storyloom123"
    s3_bucket: str = "storyloom-audio"

    # --- CLI / run store -----------------------------------------------------
    out_dir: Path = Field(default=Path("./out"))

    # --- Prompt versioning ---------------------------------------------------
    prompt_version: str = "v1"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
