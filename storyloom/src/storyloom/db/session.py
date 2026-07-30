"""SQLAlchemy engine/session factory (SPEC §1.3: Postgres from day one).

Lazily constructed so importing the package (and running the M1 pipeline) never requires a live DB.
"""

from __future__ import annotations

from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from ..config import get_settings


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    return create_engine(get_settings().database_url, pool_pre_ping=True, future=True)


@lru_cache(maxsize=1)
def _session_factory() -> sessionmaker:
    return sessionmaker(bind=get_engine(), class_=Session, expire_on_commit=False, future=True)


def get_session() -> Session:
    return _session_factory()()
