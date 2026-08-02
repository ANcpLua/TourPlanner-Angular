# Architecture

## Repository Layout

```
.
├── backend/    C# solution (API, BL, DAL, Contracts, XML generator, Tests)
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
- `TourPlanner.XmlGenerator` -- compile-time XML writer generation for report contracts
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
  - strict XML import parsing and domain/XML mapping
  - OpenAPI document generation
  - ASP.NET Identity cookie authentication
  - CORS, health checks, AOP logging

- `BL`
  - business rules and use-case orchestration
  - domain models (TourDomain, TourLogDomain)
  - PDF report generation
  - mapping configuration

- `DAL`
  - persistence (EF Core + PostgreSQL)
  - database models and migrations
  - repositories
  - external service adapters (OpenRouteService)

- `Contracts`
  - DTOs and request/response models
  - generated XML report document contract
  - shared value types for transport only

- `Tests`
  - 165 backend tests (NUnit + Moq, EF Core InMemory repository tests, and WebApplicationFactory API coverage)
  - 268 frontend tests (Vitest + Angular Testing Library)

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
