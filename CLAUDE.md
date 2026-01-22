# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Huoltokirja ("Maintenance Book") is a Python REST API application for tracking regular maintenance of items. It uses FastAPI with PostgreSQL persistence, follows TDD principles with Python type annotations, and uses Pydantic for data validation.

## Commands

### Docker Commands (Recommended)

```bash
# Start development server with hot reload
make dev

# Start production server
make up

# Stop all containers
make down

# Run tests
make test

# Run database migrations
make migrate

# Create new migration
make migrate-new

# Populate database with sample test data
make populate

# View logs
make logs

# Shell into app container
make shell

# Shell into database
make db-shell

# Clean up volumes
make clean
```

### Local Development with uv

```bash
# Install dependencies
make install
# or
uv sync

# Run tests locally
make test-local
# or
uv run pytest tests/ -v

# Run a single test
uv run pytest tests/test_items.py::test_create_item

# Lint code
make lint
# or
uv run pylint app/

# Run development server locally
make run
# or
uv run uvicorn app.main:app --reload

# Add a new dependency
uv add <package>

# Add a new dev dependency
uv add --group dev <package>

# Populate database with sample test data
make populate-local
# or
uv run python -m scripts.populate
```

### Legacy Commands (Original Pipenv)

```bash
# Install dependencies
pipenv install --dev

# Run original tests
pipenv run pytest tests.py
```

## Architecture

The application implements a REST API with hierarchical item structure:

### Core Entities
- **Item** - Maintainable object (car, house, bike) with tree structure via `parent_id`
- **Document** - File attachments for items (manuals, receipts, photos)
- **Comment** - Notes and observations on items
- **MaintenanceLog** - Historical record of maintenance performed

### Hierarchical Example
```
House → HVAC → Filter
            → Compressor
      → Plumbing
Car → Engine → Oil Filter
            → Air Filter
      → Tires
```

### Tech Stack
- **Framework:** FastAPI
- **Database:** PostgreSQL 16 (async via asyncpg)
- **ORM:** SQLAlchemy 2.0 with async support
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **File storage:** Local filesystem (Docker volume)
- **Container:** Docker + docker-compose
- **Package manager:** uv

## Project Structure

```
huoltokirja/
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── alembic/
│   ├── env.py
│   └── versions/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings
│   ├── api/v1/
│   │   ├── router.py
│   │   ├── items.py
│   │   ├── documents.py
│   │   └── comments.py
│   ├── models/              # SQLAlchemy models
│   │   ├── base.py
│   │   ├── item.py
│   │   ├── document.py
│   │   ├── comment.py
│   │   └── maintenance_log.py
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── db/                  # Database session
├── tests/
├── scripts/
│   └── populate.py          # Sample data population
├── uploads/                 # Document storage
├── pyproject.toml
├── uv.lock
├── alembic.ini
└── Makefile
```

## API Endpoints

### Items
- `GET /api/v1/items` - List root items
- `POST /api/v1/items` - Create root item
- `GET /api/v1/items/{id}` - Get item with children
- `PUT /api/v1/items/{id}` - Update item
- `DELETE /api/v1/items/{id}` - Delete item (cascades)
- `POST /api/v1/items/{id}/children` - Create child item
- `GET /api/v1/items/due` - Items due for maintenance

### Maintenance
- `POST /api/v1/items/{id}/maintenance` - Log maintenance done
- `GET /api/v1/items/{id}/maintenance` - Get history
- `PUT /api/v1/items/{id}/schedule` - Set maintenance schedule

### Documents
- `GET /api/v1/items/{id}/documents` - List documents
- `POST /api/v1/items/{id}/documents` - Upload file
- `GET /api/v1/documents/{id}/download` - Download file
- `DELETE /api/v1/documents/{id}` - Delete document

### Comments
- `GET /api/v1/items/{id}/comments` - List comments
- `POST /api/v1/items/{id}/comments` - Add comment
- `PUT /api/v1/comments/{id}` - Update comment
- `DELETE /api/v1/comments/{id}` - Delete comment

## Key Files

- `app/main.py` - FastAPI application entry point
- `app/models/item.py` - Core Item model with tree structure
- `app/services/` - Business logic layer
- `app/api/v1/` - API route handlers
- `tests/` - pytest async tests
- `scripts/populate.py` - Database population script for testing
- `main.py` - Original Pydantic models (preserved for reference)
- `tests.py` - Original pytest tests (preserved for reference)
