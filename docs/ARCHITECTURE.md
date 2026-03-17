# Architecture

## Repository Layout

```
.
├── backend/    C# solution (API, BL, DAL, Contracts, Tests)
├── frontend/   Angular 21 workspace
├── deploy/     Docker, compose, nginx
└── docs/       Architecture, grading checklist, wireframes
```

## Projects

- `Angular` (frontend) -- Angular 21, Vitest, MVVM with signals
- `API` -- ASP.NET Core 10, minimal API endpoints + controllers
- `BL` -- business logic, domain models, Mapster, QuestPDF
- `DAL` -- EF Core + PostgreSQL, Identity, OpenRouteService adapter
- `Contracts` -- shared DTOs between API and frontend
- `Tests` -- NUnit + Moq (backend), Vitest (frontend)

## Ownership

- `Angular`
  - components, pages, ViewModels
  - UI state via signals
  - client-side validation
  - navigation and routing
  - map presentation (Leaflet)

- `API`
  - HTTP endpoints and controllers
  - request validation at transport boundary
  - OpenAPI document generation
  - ASP.NET Identity cookie authentication
  - CORS, health checks, AOP logging

- `BL`
  - business rules and use-case orchestration
  - domain models (TourDomain, TourLogDomain)
  - PDF report generation
  - import/export logic
  - mapping configuration

- `DAL`
  - persistence (EF Core + PostgreSQL)
  - database models and migrations
  - repositories
  - external service adapters (OpenRouteService)

- `Contracts`
  - DTOs and request/response models
  - shared value types for transport only

- `Tests`
  - 170 backend tests (NUnit + Moq, integration tests with Testcontainers)
  - 259 frontend tests (Vitest + Angular Testing Library)

## Rules

- `API` must not reference models from `Angular`
- `Angular` must not know `BL` or `DAL` directly
- `BL` must not depend on `Angular`
- `DAL` must not own UI or HTTP models
- `Contracts` must not contain business logic

## Client-Agnostic Backend

- The backend owns an HTTP/OpenAPI contract, not an Angular-specific integration
- `API`, `BL`, `DAL`, and `Contracts` must remain usable by any client generated from or coded against that contract
- The frontend is replaceable; backend code must not assume Angular services, signals, components, or ViewModels
- Generated API types describe transport; they do not define the frontend architecture

## Model and ViewModel Separation

- Models and ViewModels are different responsibilities and must not be merged
- Generated API models and shared contract models describe transport only
- Frontend models describe UI-facing semantics, derived values, normalization, parsing, and mapping from transport to presentation
- ViewModels own screen state, commands, async workflows, loading flags, selection, and error presentation
- Components consume ViewModels, not raw transport DTOs
- A ViewModel may use a model, but a model must not depend on Angular state or ViewModel concerns
