# Architecture

## Projects

- `UI.Client`
- `API`
- `BL`
- `DAL`
- `Contracts`
- `Tests`

## Ownership

- `UI.Client`
  - Views
  - Components
  - ViewModels
  - UI state
  - client-side validation
  - navigation
  - map presentation

- `API`
  - endpoints
  - request validation at HTTP boundary
  - transport mapping
  - OpenAPI
  - auth later if needed

- `BL`
  - business rules
  - use-case logic
  - orchestration
  - report generation coordination
  - import and export rules

- `DAL`
  - persistence
  - database models
  - repositories
  - external service adapters

- `Contracts`
  - DTOs
  - request and response models
  - shared enums and value types for transport only

- `Tests`
  - layer-specific tests

## Rules

- `API` must not reference models from `UI.Client`
- `UI.Client` must not know `BL` or `DAL` directly
- `BL` must not depend on `UI.Client`
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
- Review must treat model/ViewModel collapse as an ownership failure, not a stylistic preference
