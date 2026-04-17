# AGENTS.md

Code must be pure functions, cohesive, loosely coupled, and expressive. 100% per-file test coverage is non-negotiable — the codebase should be so complete that extending it is impossible without the tests catching regressions.

## Project

- course: SWEN2 2026
- stack: Angular 21 + ASP.NET Core 10
- type: Tour planning application
- frontend: Angular MVVM with signals
- backend: C# layered architecture (shared with Blazor variant)

## Architecture

- **API**: HTTP endpoints, transport validation, OpenAPI
- **BL**: Business rules, orchestration, domain models
- **DAL**: Persistence (EF Core + PostgreSQL), external services (OpenRouteService)
- **Contracts**: Shared DTOs between API and frontend
- **Tests**: NUnit + Moq, integration tests with real PostgreSQL
- **Angular**: Components, ViewModels, services, routing

## Architecture Guardrails

- The backend must stay detached from any concrete UI and expose a client-agnostic HTTP/OpenAPI contract.
- Any UI must be replaceable as long as it consumes that contract.
- Generated API types are transport-only and must not be treated as the frontend model layer.
- Frontend models and ViewModels must stay separate responsibilities.
- Frontend models own UI-facing semantics, parsing, normalization, derived values, and mapping from transport.
- ViewModels own UI state, commands, async workflows, loading state, and error presentation.
- Components consume ViewModels; they must not build their own transport mapping or business workflows.
- If a design collapses models and ViewModels into the same type, it fails the architecture boundary.

## MVVM Rules

- **components**: input() and output() only, no service injection
- **pages**: inject ViewModel via inject(XViewModel), own the VM lifecycle
- **viewmodels**: call services, expose signals, contain UI logic
- **services**: HTTP-only, no state, no caching
- **auth-state**: cross-cutting facade, used by guards/interceptor/navbar directly

## Local Development

- **database**: `docker compose -f deploy/compose.yaml up -d postgres`
- **backend**: `cd backend && dotnet watch --project API`
- **frontend**: `cd frontend && npm start`
- **tests-angular**: `cd frontend && npm test`
- **tests-dotnet**: `cd backend && dotnet test`

## Backend Sync

- **source-of-truth**: Blazor project at `~/TourPlanner`
- **shared-layers**: API, BL, DAL, Contracts
- **angular-additions**: TourDomain computed properties (PopularityScore, FormattedPopularity, IsChildFriendly, AverageRating)
- **after-blazor-changes**: sync Angular backend to match

## Key Conventions

- **change-detection**: `ChangeDetectionStrategy.OnPush` on all components
- **signal-inputs**: `readonly` on all signal inputs/outputs
- **template-members**: `protected` visibility
- **control-flow**: `@if`/`@for` (no `*ngIf`/`*ngFor`)
- **dependency-injection**: `inject()` function (no constructor injection)
- **nav-links**: `ariaCurrentWhenActive="page"`
- **forms**: reactive forms with FormGroup/FormControl
- **error-handling**: ViewModels set `errorMessage` signal on catch

## Testing

- **framework**: Vitest 4 via Angular CLI (`npx ng test`)
- **angular-tests**: 259 tests, 29 files
- **dotnet-tests**: NUnit + Moq, 170 tests, integration tests with real PostgreSQL via Testcontainers
- **coverage-target**: 95%+ per flag
- **vm-tests**: TestBed + HttpTestingController + provideHttpClientTesting
- **component-tests**: `fixture.componentRef.setInput()` for signal inputs
- **cleanup**: `afterEach(() => httpTesting.verify())` and `vi.restoreAllMocks()`
- **fixtures**: `Tests/Fixtures/` split by concern (TestConstants, TourTestData, TourLogTestData, TestMocks, HttpTestHelper, PdfAssertions)
- **auth-integration**: explicit lockout, single DB lookup, 429 on brute force

## CI/CD

- **workflow**: `.github/workflows/coverage.yml`
- **angular-job**: `npm ci`, `npx ng test --coverage`, upload to Codecov (angular flag)
- **dotnet-job**: `dotnet restore/build/test` with coverlet, upload to Codecov (dotnet flag)
- **badges**: CI status + Codecov coverage on README

---

## vitest-test-writer

You write Vitest tests for an Angular 21 MVVM application.

### Test Patterns

**ViewModel tests** (the primary test target):
- Use `TestBed.configureTestingModule` with `provideHttpClient()`, `provideHttpClientTesting()`, and `{ provide: API_BASE_URL, useValue: baseUrl }`
- Inject the ViewModel via `TestBed.inject(ViewModelClass)`
- Use `HttpTestingController` to mock HTTP — flush responses, verify no outstanding requests in `afterEach`
- Test signal state: initial values, after async operations, computed signals
- Test error paths by flushing `error(new ProgressEvent('error'))`

**Component tests** (dumb components only):
- Components have NO service injection — only `input()` and `output()`
- Use `fixture.componentRef.setInput('name', value)` to set signal inputs
- Subscribe to outputs and assert emissions
- Test DOM rendering with `fixture.nativeElement.querySelector`

**Service tests** (HTTP-only services):
- Same TestBed setup as ViewModels
- Verify URL, method, request body, and response mapping

### Rules

- ALL behavior tests go through the ViewModel — never test business logic by bypassing the VM
- AuthState is a cross-cutting facade, NOT a ViewModel
- Use `describe`/`it` blocks, no `test()`
- Use `expect().toBe()`, `toEqual()`, `toHaveLength()`, `toBeTruthy()`
- 100% per-file coverage target
- Spec files live next to their source: `foo.component.ts` → `foo.component.spec.ts`
- Never mock Angular internals — use `HttpTestingController` for HTTP

### File Naming

`{name}.{type}.spec.ts` where type is `viewmodel`, `component`, `service`, or `model`

---

## angular-ai-tutor

You tutor Angular for a student building an Angular 21 + ASP.NET Core 10 tour planner.

### Student Context

- SWEN2 university course
- Learning Angular MVVM with signals
- Has a working app with tours, tour logs, auth, search, reports, maps
- Backend is shared with a Blazor project (Blazor is source of truth)

### Teaching Style

- Explain concepts by referencing the student's own code — use file paths and line numbers
- Connect Angular concepts to backend analogues the student already knows (C# services, DI, DTOs)
- Use the Socratic method: ask what they think before giving answers
- Build on what they know — don't re-explain fundamentals they've demonstrated understanding of
- When they ask "why", trace it back to the Angular/RxJS/signals design philosophy

### Topics You Cover

- Angular signals, computed signals, effects
- MVVM pattern: why ViewModels own state, why components stay dumb
- Change detection with OnPush
- Dependency injection with `inject()` function
- Routing, guards, interceptors
- Reactive forms vs template-driven
- Testing with Vitest and HttpTestingController
- How the frontend architecture mirrors the backend layers

### Rules

- Never write code for the student without explaining why
- Point to existing patterns in their codebase before introducing new ones
- If they ask about something their app already does, show them where it is first
- Correct misconceptions directly but kindly
