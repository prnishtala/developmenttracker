"""StoryLoom CLI (SPEC §3, §15).

Commands:
  generate-episode   run the full pipeline to a mastered MP3 in ./out/
  replay-stage       re-run a single stage from persisted run state
  compare-tts        A/B two TTS providers on the identical script
  seed-bible         write an example Story Bible to disk
"""

from __future__ import annotations

import logging
import re
from datetime import UTC, datetime
from pathlib import Path

import typer

from .bible.service import load_bible
from .config import get_settings
from .pipeline import runner
from .pipeline.context import StageContext
from .pipeline.runstore import RunStore
from .pipeline.sanitize import sanitize_theme
from .providers.llm import get_llm_provider
from .providers.tts import get_tts_provider

app = typer.Typer(add_completion=False, help="StoryLoom episode generation pipeline (M1).")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "child"


def _default_seed() -> Path:
    return Path("seed/bible.example.json")


@app.command()
def generate_episode(
    bible: Path = typer.Option(_default_seed(), "--bible", help="Path to the Story Bible JSON."),
    theme: str = typer.Option("", "--theme", help="Requested theme, e.g. 'trains'."),
    minutes: int = typer.Option(0, "--minutes", help="Target minutes (0 = use bible default)."),
    llm: str = typer.Option("", "--llm", help="Override LLM provider: offline|anthropic."),
    tts: str = typer.Option("", "--tts", help="Override TTS provider: offline|elevenlabs|openai."),
    out: Path = typer.Option(None, "--out", help="Output dir (default: STORYLOOM_OUT_DIR)."),
    season: int = typer.Option(1, "--season"),
    number: int = typer.Option(0, "--number", help="Episode number (0 = next from bible)."),
    yes: bool = typer.Option(False, "--yes", help="Confirm paid TTS spend (SPEC §15)."),
) -> None:
    """Run outline → draft → safety → narrate → master → publish-preview."""
    settings = get_settings()
    story_bible = load_bible(bible)

    # Safety layer 1: parent-supplied theme is untrusted (SPEC §7.1).
    theme = sanitize_theme(theme)

    target_minutes = minutes or story_bible.child.attention_span_minutes or 7
    ep_number = number or story_bible.next_episode_number()
    out_dir = out or settings.out_dir
    slug = f"{_slugify(story_bible.child.name)}-s{season}e{ep_number:02d}"
    store = RunStore(Path(out_dir) / slug)

    try:
        llm_provider = get_llm_provider(settings, override=llm or None)
        tts_provider = get_tts_provider(settings, override=tts or None)
    except (RuntimeError, ValueError) as exc:
        typer.secho(str(exc), fg=typer.colors.RED, err=True)
        raise typer.Exit(code=2) from exc

    # Persist params so replay-stage can reconstruct the context.
    store.merge_meta(
        {
            "params": {
                "bible_path": str(bible),
                "theme": theme,
                "target_minutes": target_minutes,
                "llm_provider": llm_provider.name,
                "tts_provider": tts_provider.name,
                "prompt_version": settings.prompt_version,
                "season": season,
                "number": ep_number,
            },
            "created_at": datetime.now(UTC).isoformat(),
        }
    )

    ctx = StageContext(
        store=store,
        settings=settings,
        llm=llm_provider,
        tts=tts_provider,
        bible=story_bible,
        theme=theme,
        target_minutes=target_minutes,
        prompt_version=settings.prompt_version,
    )

    typer.secho(
        f"\n▶ Generating {slug}  (llm={llm_provider.name}, tts={tts_provider.name})", bold=True
    )
    result = runner.generate(ctx, confirm_spend=yes)

    # Always show the script (SPEC §15: show the script before spending on TTS).
    if store.script_path.exists():
        typer.secho("\n--- SCRIPT " + "-" * 60, fg=typer.colors.CYAN)
        typer.echo(store.script_path.read_text(encoding="utf-8"))
        typer.secho("-" * 71, fg=typer.colors.CYAN)

    typer.secho(f"\nStatus: {result.status}", bold=True)
    typer.echo(f"Stages run: {', '.join(result.stages_run)}")
    if result.message:
        typer.echo(result.message)
    if result.status == runner.STATUS_MASTERED and store.master_path.exists():
        typer.secho(f"\n✓ MP3: {store.master_path}", fg=typer.colors.GREEN, bold=True)
    typer.echo(f"Run dir: {store.root}")


@app.command()
def replay_stage(
    run: Path = typer.Option(..., "--run", help="Run directory under ./out/."),
    stage: str = typer.Option(..., "--stage", help="outline|draft|safety|narrate|master|publish"),
    llm: str = typer.Option("", "--llm"),
    tts: str = typer.Option("", "--tts"),
) -> None:
    """Re-run one stage from persisted state (idempotent)."""
    settings = get_settings()
    store = RunStore(run)
    if not store.meta_path.exists():
        raise typer.BadParameter(f"No meta.json in {run}; is this a run directory?")
    params = store.read_json(store.meta_path).get("params", {})

    story_bible = load_bible(params.get("bible_path", str(_default_seed())))
    ctx = StageContext(
        store=store,
        settings=settings,
        llm=get_llm_provider(settings, override=llm or params.get("llm_provider")),
        tts=get_tts_provider(settings, override=tts or params.get("tts_provider")),
        bible=story_bible,
        theme=params.get("theme", ""),
        target_minutes=params.get("target_minutes", 7),
        prompt_version=params.get("prompt_version", settings.prompt_version),
    )
    runner.replay_stage(ctx, stage)
    typer.secho(f"✓ Replayed stage '{stage}' in {run}", fg=typer.colors.GREEN)


@app.command()
def compare_tts(
    run: Path = typer.Option(..., "--run", help="Run dir with an existing script.md."),
    providers: str = typer.Option("elevenlabs,openai", "--providers", help="Comma-separated."),
) -> None:
    """Synthesize + master the SAME script with each TTS provider for A/B listening (SPEC §1.5)."""
    settings = get_settings()
    store = RunStore(run)
    if not store.script_path.exists():
        raise typer.BadParameter(f"No script.md in {run}; run generate-episode first.")
    params = store.read_json(store.meta_path).get("params", {}) if store.meta_path.exists() else {}
    story_bible = load_bible(params.get("bible_path", str(_default_seed())))

    from .audio.mixer import master as run_master

    for name in [p.strip() for p in providers.split(",") if p.strip()]:
        typer.secho(f"\n▶ Rendering with TTS provider: {name}", bold=True)
        ctx = StageContext(
            store=store,
            settings=settings,
            llm=get_llm_provider(settings),
            tts=get_tts_provider(settings, override=name),
            bible=story_bible,
            theme=params.get("theme", ""),
            target_minutes=params.get("target_minutes", 7),
        )
        from .pipeline.stages import narrate

        narrate.run(ctx)
        out_mp3 = store.root / f"master.{name}.mp3"
        info = run_master(
            store.narration_path,
            out_mp3,
            music_bed=settings.music_bed_path,
            workdir=store.work_dir,
            target_lufs=settings.target_lufs,
            target_true_peak=settings.target_true_peak,
            mp3_bitrate=settings.mp3_bitrate,
        )
        typer.secho(f"  ✓ {out_mp3}  ({info['duration_s']}s, {info['measured_lufs']} LUFS)",
                    fg=typer.colors.GREEN)


@app.command()
def seed_bible(
    out: Path = typer.Option(_default_seed(), "--out", help="Where to write the example bible."),
) -> None:
    """Write an example Story Bible (SPEC §5 schema) to disk."""
    from .bible.example import EXAMPLE_BIBLE
    from .bible.service import save_bible

    out.parent.mkdir(parents=True, exist_ok=True)
    save_bible(EXAMPLE_BIBLE, out)
    typer.secho(f"✓ Wrote example bible → {out}", fg=typer.colors.GREEN)


if __name__ == "__main__":
    app()
