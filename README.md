# PrepHelp

PrepHelp is an adaptive communication-skills coach for students. It combines a React web client, an Express API, a background worker, and a FastAPI service for speech and text analysis.

## Features

- Practice flows for spoken and written communication
- Account, exercise, session, and progress API endpoints
- Speech and text analysis, with coaching and planning endpoints
- MongoDB persistence and Redis-backed background jobs
- A public landing page and responsive practice interface

Some landing-page statistics, testimonials, and institution marks are sample content. Review the [product specification](docs/spec.md) and [API documentation](docs/api.md) for implementation details.

## Stack

| Component | Technologies | Local URL |
| --- | --- | --- |
| Web client | React, TypeScript, Vite, Tailwind CSS | http://localhost:5173 |
| API server | Node.js, Express, TypeScript | http://localhost:4000 |
| ML service | Python, FastAPI | http://localhost:8000 |
| Database | MongoDB 7 | localhost:27017 |
| Job queue | Redis 7 | localhost:6379 |

## Run with Docker Compose

### Prerequisites

- Docker Desktop with Docker Compose
- Node.js 22 or newer and npm (for running checks or individual services)
- Python 3.11 or newer (for running ML tests locally)

### Start the stack

From the project root, create a local environment file if you do not already have one, then start the services:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up --build
```

The first ML-service image build may take a while because it installs speech-processing dependencies. Once the containers are ready, open http://localhost:5173. API health checks are available at http://localhost:4000/health and http://localhost:8000/health.

To stop the services, press `Ctrl+C`, then run:

```powershell
docker compose down
```

Compose stores MongoDB data and uploaded audio in named volumes. To remove those local volumes as well, run `docker compose down --volumes`; this permanently deletes that local data.

## Run the client by itself

This is useful for working on the landing page. API-backed features require the backend services.

```powershell
Set-Location client
npm ci
npm run dev
```

For a production build and local preview:

```powershell
npm run build
npm run preview
```

## Checks

From the project root, install dependencies and run the checks:

```powershell
# client
Push-Location client
npm ci
npm run lint
npm run build
Pop-Location

# server
Push-Location server
npm ci
npm test
npm run build
Pop-Location

# worker
Push-Location worker
npm ci
npm run build
Pop-Location

# ML service
Push-Location ml-service
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest
Pop-Location
```

For local API/worker development, MongoDB and Redis must be available; Docker Compose can provide them.

## Repository layout

```text
client/       React application
server/       Express API, models, and database seed script
worker/       Redis queue worker
ml-service/   FastAPI speech, text, and coaching services
data/         Bundled language-learning data
docs/         API, product, data-model, and privacy documentation
prompts/      Versioned coaching and exercise prompts
docker-compose.yml
```

## Configuration and privacy

Copy `.env.example` to `.env` for local Compose runs and replace the example `JWT_SECRET` with a unique random value. Never commit `.env` files, credentials, or user recordings. The root `.gitignore` excludes environment files and local `uploads/` directories; `.env.example` is intentionally kept under version control.

Speech recordings and transcripts can contain sensitive personal data. Read the [privacy specification](docs/privacy.md) before deploying or processing real user data. The example configuration is for local development and is not production-ready.

## License

No license is currently included. Add a license before publishing if you want to grant others permission to reuse or distribute this project.
