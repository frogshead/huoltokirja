.PHONY: dev up down test migrate migrate-new logs shell db-shell clean install sync lint populate frontend-install frontend-dev frontend-build frontend-lint

# Install dependencies locally using uv
install:
	uv sync

# Sync dependencies (update lock file if needed)
sync:
	uv sync

# Start development server with hot reload
dev:
	docker compose -f docker/docker-compose.dev.yml up --build

# Start production server
up:
	docker compose -f docker/docker-compose.yml up --build -d

# Stop all containers
down:
	docker compose -f docker/docker-compose.yml down
	docker compose -f docker/docker-compose.dev.yml down

# Run tests in Docker
test:
	docker compose -f docker/docker-compose.dev.yml run --rm app uv run pytest

# Run tests locally
test-local:
	uv run pytest tests/ -v

# Run migrations
migrate:
	docker compose -f docker/docker-compose.dev.yml run --rm app uv run alembic upgrade head

# Create a new migration
migrate-new:
	@read -p "Migration message: " msg; \
	docker compose -f docker/docker-compose.dev.yml run --rm app uv run alembic revision --autogenerate -m "$$msg"

# View logs
logs:
	docker compose -f docker/docker-compose.yml logs -f

# Shell into app container
shell:
	docker compose -f docker/docker-compose.dev.yml run --rm app /bin/bash

# Shell into database
db-shell:
	docker compose -f docker/docker-compose.dev.yml exec db psql -U huoltokirja

# Clean up volumes and images
clean:
	docker compose -f docker/docker-compose.yml down -v
	docker compose -f docker/docker-compose.dev.yml down -v

# Lint code locally
lint:
	uv run pylint app/

# Lint code in Docker
lint-docker:
	docker compose -f docker/docker-compose.dev.yml run --rm app uv run pylint app/

# Run development server locally
run:
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Add a new dependency
add:
	@read -p "Package name: " pkg; \
	uv add $$pkg

# Add a new dev dependency
add-dev:
	@read -p "Package name: " pkg; \
	uv add --group dev $$pkg

# Populate database with sample test data (Docker)
populate:
	docker compose -f docker/docker-compose.dev.yml run --rm app uv run python -m scripts.populate

# Populate database with sample test data (local)
populate-local:
	uv run python -m scripts.populate

# Frontend commands
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

# Build frontend and start production server
build-all: frontend-build up
