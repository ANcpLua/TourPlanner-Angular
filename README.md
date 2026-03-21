# TourPlanner (Angular)

[![Tests and Coverage](https://github.com/ANcpLua/TourPlanner-Angular/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/ANcpLua/TourPlanner-Angular/actions/workflows/coverage.yml)
[![codecov](https://codecov.io/gh/ANcpLua/TourPlanner-Angular/branch/main/graph/badge.svg?token=J9JZVG4PRZ)](https://codecov.io/gh/ANcpLua/TourPlanner-Angular)

SWEN2 2026 -- Tour planning application with .NET 10 backend and Angular 21 frontend.

## Quick Start (Docker)

Requires Docker or OrbStack.

```bash
docker compose up -d
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
docker compose down
```

### Port conflicts

If any port is already in use, copy the example env file and adjust:

```bash
cp .env.example .env
# edit .env, then:
docker compose up -d
```

## Local Development

### Prerequisites

- Node 22.x (see `.nvmrc`)
- npm 10.x
- .NET SDK 10.0
- Docker or OrbStack (for PostgreSQL)

### Steps

1. Start the database:

```bash
docker compose up -d postgres
```

2. Start the API:

```bash
dotnet watch --project API
```

3. Install frontend dependencies and start (separate terminal):

```bash
npm ci
npm start
```

Open http://localhost:7226.

## Build

```bash
dotnet build API/API.csproj
npm run build
```

## Tests

```bash
npm test
```

## Architecture

Same backend as the Blazor variant. The Angular frontend demonstrates that the UI layer is interchangeable when the API contract is stable.

| Layer      | Responsibility                        |
|------------|---------------------------------------|
| Angular    | Components, ViewModels, routing       |
| API        | HTTP endpoints, transport validation  |
| BL         | Business rules, orchestration         |
| DAL        | Persistence, external service access  |
| Contracts  | Shared DTOs                           |
