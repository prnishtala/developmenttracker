.PHONY: install up down migrate test lint episode clean

install:
	python -m pip install -e ".[dev]"

up:
	docker compose up -d

down:
	docker compose down

migrate:
	alembic upgrade head

test:
	pytest

lint:
	ruff check src tests

# Generate one episode fully offline (no API keys needed).
episode:
	storyloom generate-episode --bible seed/bible.example.json --theme "trains"

clean:
	rm -rf out .pytest_cache .ruff_cache
