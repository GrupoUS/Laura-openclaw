# Universal Data System

Near real-time searchable knowledge base from Google Drive.

## Features

- **Hybrid Search**: BM25 + vector search with RRF fusion
- **Real-time Updates**: Google Drive push notifications via webhook
- **Smart Chunking**: Semantic chunking with heading preservation
- **Gemini Embeddings**: 768-dim vectors via Matryoshka RL (50% storage savings)
- **Multi-format Support**: PDF, DOCX, PPTX, Google Docs/Sheets/Slides

## Quick Start

### 1. Prerequisites

- Docker + Docker Compose
- Google Cloud project with Drive API enabled
- Gemini API key

### 2. Setup

```bash
# Clone and configure
cd universal-data-system
cp .env.example .env
# Edit .env with your credentials

# Start services
docker compose up -d

# Apply migrations
python scripts/migrate.py

# Setup OAuth (opens browser)
python scripts/setup_oauth.py

# Bootstrap initial index
python scripts/bootstrap_index.py --all

# Start worker (processes queue)
arq src.workers.settings.WorkerSettings
```

### 3. Search

```bash
# Hybrid search (BM25 + vector)
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "quarterly reports", "top_k": 10}'

# Vector-only semantic search
curl -X POST http://localhost:8000/search \
  -d '{"query": "budget analysis", "search_type": "vector"}'
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Google Drive│────▶│    Nginx     │────▶│   FastAPI   │
│   Webhook   │     │  (HTTPS/TLS) │     │     API     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────┐     ┌──────▼──────┐
                    │    Redis     │◀────│  arq Worker │
                    │   (Queue)    │     │  (Tasks)    │
                    └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────────────────▼──────────────────────────┐
                    │                  PostgreSQL 17                       │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
                    │  │  pgvector   │  │pg_textsearch│  │   Tables    │  │
                    │  │ (HNSW 768d) │  │   (BM25)    │  │             │  │
                    │  └─────────────┘  └─────────────┘  └─────────────┘  │
                    └─────────────────────────────────────────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/search` | POST | Hybrid search (BM25 + vector) |
| `/context` | POST | Get full context for chunks |
| `/drive/webhook` | POST | Google Drive push notifications |

## Configuration

Key environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis for task queue |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `GEMINI_API_KEY` | Gemini embedding API key |
| `WEBHOOK_BASE_URL` | Public URL for webhooks |

See `.env.example` for all options.

## Stack

- **Runtime**: Python 3.12
- **API**: FastAPI + Uvicorn
- **Database**: PostgreSQL 17 + pgvector + pg_textsearch
- **Queue**: arq (Redis)
- **Embeddings**: Gemini text-embedding-004 (768d MRL)
- **Extraction**: PyMuPDF4LLM, python-docx, python-pptx

## Development

```bash
# Install dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Type check
mypy src/

# Format
ruff format .
```

## License

MIT
