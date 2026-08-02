# TourPlanner (Angular)

[![Tests and Coverage](https://github.com/ANcpLua/TourPlanner-Angular/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/ANcpLua/TourPlanner-Angular/actions/workflows/coverage.yml)
[![codecov](https://codecov.io/gh/ANcpLua/TourPlanner-Angular/branch/main/graph/badge.svg?token=WT105R5OX4)](https://codecov.io/gh/ANcpLua/TourPlanner-Angular)

SWEN2 2026 -- Tour planning application with .NET 10 backend and Angular 21 frontend.

## Repository Layout

```
.
├── backend/    C# solution (API, BL, DAL, Contracts, XML generator, Tests) + sln + props + openapi output
├── frontend/   Angular 21 workspace (src, public, angular.json, package.json, tsconfig*)
├── deploy/     Docker, compose, nginx
└── docs/       Grading checklist, layout proposal, architecture notes, wireframes
```

## Quick Start (Docker)

Requires Docker or OrbStack. Compose file lives in `deploy/`:

```bash
docker compose -f deploy/compose.yaml up -d
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:7226         |
| API      | http://localhost:7102         |
| pgAdmin  | http://localhost:5050         |
| Health   | http://localhost:7102/health  |

pgAdmin login: `admin@admin.com` / `admin`

To stop:

```bash
docker compose -f deploy/compose.yaml down
```

### Port conflicts

If any port is already in use, copy the example env file and adjust:

```bash
cp .env.example deploy/.env
# edit deploy/.env, then:
docker compose -f deploy/compose.yaml up -d
```

## Local Development

### Prerequisites

- Node 22.x
- npm 10.x
- .NET SDK 10.0
- Docker or OrbStack (for PostgreSQL)

### Steps

1. Start the database:

```bash
docker compose -f deploy/compose.yaml up -d postgres
```

2. Start the API (from `backend/`):

```bash
cd backend && dotnet watch --project API
```

3. Install frontend dependencies, regenerate the OpenAPI client types, and start the frontend in a separate terminal (from `frontend/`):

```bash
cd frontend
npm ci
npm run generate
npm start
```

Open http://localhost:7226.

## Build

```bash
(cd frontend && npm run generate)
(cd backend && dotnet build API/API.csproj)
(cd frontend && npm run build)
```

## Tests

**429 tests total -- 170 backend (NUnit) + 259 frontend (Vitest), all passing.**

Backend (from `backend/`):

```bash
cd backend && dotnet test
```

Frontend (from `frontend/`):

```bash
cd frontend && npm test
```

Run the full local verification pipeline (from `frontend/`):

```bash
cd frontend && npm run verify
```

## Architecture

Same backend as the Blazor variant. The Angular frontend demonstrates that the UI layer is interchangeable when the API contract is stable.

| Layer      | Responsibility                        | Location              |
|------------|---------------------------------------|-----------------------|
| Angular    | Components, ViewModels, routing       | `frontend/src/app`    |
| API        | HTTP endpoints, transport validation  | `backend/API`         |
| BL         | Business rules, orchestration         | `backend/BL`          |
| DAL        | Persistence, external service access  | `backend/DAL`         |
| Contracts  | Shared DTOs                           | `backend/Contracts`   |

See `docs/GRADING-CHECKLIST.md` for the full spec-vs-implementation matrix and `docs/LAYOUT-PROPOSAL.md` for the rationale behind the folder split.
