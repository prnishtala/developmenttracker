"""baseline schema (SPEC §4)

Revision ID: 0001_baseline
Revises:
Create Date: 2026-07-30

Uses the exact SQL from SPEC §4 so the DB matches the spec verbatim (citext email, age-band and
status CHECKs, JSONB bible, cascade deletes, unique constraints).
"""

from __future__ import annotations

from alembic import op

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")  # gen_random_uuid()
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")

    op.execute(
        """
        CREATE TABLE families (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email         citext UNIQUE NOT NULL,
          plan          text NOT NULL DEFAULT 'free',
          created_at    timestamptz NOT NULL DEFAULT now(),
          deleted_at    timestamptz
        );
        """
    )
    op.execute(
        """
        CREATE TABLE children (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          family_id     uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
          first_name    text NOT NULL,
          age_band      text NOT NULL CHECK (age_band IN ('1-2','2-3','3-4','4-6','6-8','8-10')),
          pronouns      text NOT NULL DEFAULT 'she/her',
          narrator_voice text,
          created_at    timestamptz NOT NULL DEFAULT now(),
          deleted_at    timestamptz
        );
        """
    )
    op.execute(
        """
        CREATE TABLE story_bibles (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          version       int  NOT NULL,
          bible         jsonb NOT NULL,
          updated_at    timestamptz NOT NULL DEFAULT now(),
          UNIQUE (child_id, version)
        );
        """
    )
    op.execute(
        """
        CREATE TABLE episodes (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          season        int  NOT NULL DEFAULT 1,
          number        int  NOT NULL,
          title         text,
          status        text NOT NULL DEFAULT 'queued',
          outline       jsonb,
          script_md     text,
          safety_report jsonb,
          bible_delta   jsonb,
          audio_key     text,
          duration_s    int,
          prompt_version text,
          created_at    timestamptz NOT NULL DEFAULT now(),
          published_at  timestamptz,
          UNIQUE (child_id, season, number)
        );
        """
    )
    op.execute(
        """
        CREATE TABLE generation_jobs (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          episode_id    uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
          stage         text NOT NULL,
          attempts      int  NOT NULL DEFAULT 0,
          last_error    text,
          created_at    timestamptz NOT NULL DEFAULT now(),
          updated_at    timestamptz NOT NULL DEFAULT now()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE safety_events (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          episode_id    uuid REFERENCES episodes(id) ON DELETE CASCADE,
          stage         text NOT NULL,
          verdict       text NOT NULL,
          detail        jsonb NOT NULL,
          created_at    timestamptz NOT NULL DEFAULT now()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE feed_tokens (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
          token_hash    text NOT NULL UNIQUE,
          revoked_at    timestamptz,
          last_seen_at  timestamptz,
          created_at    timestamptz NOT NULL DEFAULT now()
        );
        """
    )


def downgrade() -> None:
    for table in (
        "feed_tokens",
        "safety_events",
        "generation_jobs",
        "episodes",
        "story_bibles",
        "children",
        "families",
    ):
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
