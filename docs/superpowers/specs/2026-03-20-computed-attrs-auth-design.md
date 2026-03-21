# Design: Computed Tour Attributes + Cookie Auth

## Overview

Two changes to meet grading requirements:

1. Move computed tour attributes (popularity, child-friendliness, average rating) from frontend to BL
2. Add cookie-based authentication with user ownership of tours/logs

Both the Angular and Blazor backends share the same BL/DAL/Contracts/API structure. Changes apply to both.

---

## Section 1: Computed Attributes in BL

### Domain Model

`TourDomain` gets three read-only computed properties derived from `Logs`:

- `PopularityScore` (int) -- count of logs
- `IsChildFriendly` (bool) -- true when logs exist AND all logs have difficulty <= 2.0 and rating >= 3.0. Returns false for tours with zero logs (matches existing frontend behavior, avoids vacuous-truth from `Enumerable.All` on empty collections)
- `AverageRating` (double?) -- mean of log ratings, null if no logs

These are computed on access, not stored in the database. No migration needed. `TourLogDomain.Difficulty` and `Rating` are `double` -- comparisons use `<= 2.0` and `>= 3.0`.

### DTO Changes

`TourDto` gains three new fields:

- `popularity` (string) -- mapped from `PopularityScore` via the mapping layer (e.g., 4+ = "Very popular", 3 = "Popular", etc.)
- `isChildFriendly` (bool)
- `averageRating` (double?)

Mapster `MappingConfiguration` handles the `PopularityScore` -> `popularity` string conversion.

### Search Fix

`TourRepository.SearchToursAsync` remains unchanged -- handles DB fields only (Name, Description, From, To, tour-log Comments).

`TourService.SearchTours` return type changes from `IQueryable<TourDomain>` to `IEnumerable<TourDomain>`. The DB query is materialized first (`.ToList()`), then an in-memory second pass includes tours where computed semantic values match (e.g., `PopularityScore >= 4` when searching "popular", `IsChildFriendly` when searching "child"). Search operates on semantic values, not formatted strings.

`ITourService.SearchTours` signature updates accordingly.

### PDF Reports

`PdfReportService` updated to render computed attributes (popularity, child-friendliness, average rating) in tour reports. These are already available on `TourDomain` as computed properties -- no parameter changes needed.

### Frontend Cleanup

Remove entirely from `tour.model.ts`:

- `getPopularity()`
- `getAverageRating()`
- `getIsChildFriendly()`
- `toTourView()`
- `TourView` interface

The `Tour` type absorbs `popularity`, `averageRating`, `isChildFriendly` from the DTO (backend-computed). No frontend-side domain logic remains.

`TourViewModel.tours` becomes `computed(() => this.rawTours())` -- no mapping step.

Templates that referenced `TourView` properties now reference `Tour` properties directly. No behavior change in the UI.

Test files that reference `TourView` or removed functions must also be updated: `tour.model.spec.ts`, `tour.viewmodel.spec.ts`, `tour-list.component.spec.ts`.

---

## Section 2: Cookie Auth (ASP.NET Identity)

### Backend

**Packages:** `Microsoft.AspNetCore.Identity.EntityFrameworkCore`

**DbContext:** `TourPlannerContext` extends `IdentityDbContext` instead of `DbContext`. `OnModelCreating` must call `base.OnModelCreating(modelBuilder)` to configure Identity tables. EF migration adds Identity tables.

**Seed data:** The existing seed tour in `TourPlannerContext.OnModelCreating` has no `UserId`. Either remove the seed data or assign a well-known seed user ID. Removing is simpler -- auth means users create their own tours.

**Data model:** `TourPersistence` and `TourLogPersistence` gain a `UserId` (string) FK column. Migration adds this column.

**Auth endpoints (minimal API):**

- `POST /api/auth/register` -- creates user, returns 200/400
- `POST /api/auth/login` -- signs in with cookie, returns 200/401
- `POST /api/auth/logout` -- clears cookie, returns 200
- `GET /api/auth/me` -- returns current user info if cookie is valid, 401 otherwise. Required for frontend to bootstrap auth state on page refresh.

Implemented as `AuthEndpoints.cs` with static delegate methods. `IUserContext` is resolved via delegate parameter injection (minimal APIs resolve scoped services from DI automatically).

**Authorization:** `[Authorize]` on all tour/tourlog/report controllers and endpoints.

**IUserContext:** A per-request scoped service that extracts `UserId` from `HttpContext.User`. Injected into BL services. Controllers never touch `HttpContext.User` directly.

```
IUserContext (scoped, registered via builder.Services.AddScoped)
  -> ITourService (uses userContext.UserId)
    -> ITourRepository (all queries filtered by userId)
```

**DI registration:** Identity is registered on `builder.Services` (Microsoft DI), not in an Autofac module. `IUserContext` is also registered via `builder.Services.AddScoped<IUserContext, UserContext>()`. Autofac populates from the Microsoft container, so both are available to Autofac-resolved services.

**Repository contracts:** Every method takes `userId`:

- `GetAllTours(userId)`
- `GetTourById(id, userId)`
- `CreateTourAsync(tour, userId, ct)`
- `UpdateTourAsync(tour, userId, ct)`
- `DeleteTourAsync(id, userId, ct)`
- `SearchToursAsync(searchText, userId)`

Same pattern for `ITourLogRepository`. No method exists without userId filtering.

**FileService:** Inject `IUserContext` directly (not receive userId as method param). This keeps the `IFileService` interface cleaner -- `FileService` calls `tourService` methods that also receive userId from `IUserContext`.

### CORS + Cookies + CSRF

**CORS:** Existing `AllowUI` policy already has `.AllowCredentials()`. Verify explicit frontend origins are listed (no wildcards with credentials).

**Cookie settings:** Configure Identity cookies with:

- `HttpOnly = true`
- `SameSite = Strict` (or `Lax` if cross-origin issues arise)
- `Secure = false` for local dev (production would be `true`)

**CSRF position:** For this student project, `SameSite=Strict` cookies provide sufficient protection. The API uses JSON content type (not form posts), which adds implicit CSRF resistance. No custom CSRF token implementation needed, but document this decision in the protocol.

### Frontend

**Auth state split:**

| Concern | Abstraction | Scope |
|---------|-------------|-------|
| HTTP calls to `/api/auth/*` | `AuthApiService` | HTTP only, no state |
| Global auth state (isAuthenticated, currentUser) | `AuthState` (injectable service) | App-wide, used by guards/interceptor/navbar |
| Login/register page orchestration | `AuthViewModel` | Page-scoped, used only by login/register pages |

`AuthState` is the single source of truth for auth status. Route guards, HTTP interceptor, and navbar inject `AuthState`, not `AuthViewModel`.

**Session bootstrap:** On app init, `AuthState` calls `GET /api/auth/me` to check if the cookie is still valid. This prevents authenticated users from being redirected to login on page refresh.

**Logout state reset:** On logout (or 401), `AuthState` clears its own state AND notifies root-scoped ViewModels (`TourViewModel`, `TourLogViewModel`, `SearchViewModel`, `ReportViewModel`) to clear cached data. This prevents data leaking between user sessions. Implementation: either ViewModels subscribe to `AuthState.isAuthenticated` and clear on false, or `AuthState` exposes a `logout$` event.

**Folder structure:**

```
src/app/core/auth/
  auth-api.service.ts      -- HTTP only
  auth-state.service.ts    -- global auth state (signals)
  auth.guard.ts            -- route guard, injects AuthState
  auth.interceptor.ts      -- adds withCredentials, handles 401

src/app/features/auth/
  pages/
    login-page.component.ts
    register-page.component.ts
  viewmodels/
    auth.viewmodel.ts      -- login/register page logic only
  models/
    auth.model.ts           -- LoginRequest, RegisterRequest, UserInfo
```

**HTTP configuration:** `withCredentials: true` configured once at the `HttpClient` provider level (or in `ApiClientService`), not per-request.

**Route guard:** Checks `AuthState.isAuthenticated`. Redirects to `/login` if false. Applied to all routes except `/login` and `/register`.

**Interceptor:** On 401 response, clears `AuthState` and redirects to `/login`.

---

## Files Changed

### Backend (new)

- `API/Endpoints/AuthEndpoints.cs`
- `API/Infrastructure/UserContext.cs` (implements `IUserContext`)
- `BL/Interface/IUserContext.cs`

### Backend (modified)

- `BL/DomainModel/TourDomain.cs` -- add computed properties
- `Contracts/Tours/TourDto.cs` -- add popularity, isChildFriendly, averageRating
- `BL/Mapper/MappingConfiguration.cs` -- map PopularityScore -> popularity string
- `BL/Service/TourService.cs` -- inject IUserContext, extend search (return type -> IEnumerable), in-memory filter
- `BL/Service/TourLogService.cs` -- inject IUserContext
- `BL/Service/FileService.cs` -- inject IUserContext
- `BL/Service/PdfReportService.cs` -- render computed attributes in reports
- `BL/Service/RouteService.cs` -- unchanged (routes are not user-scoped)
- `BL/Interface/ITourService.cs` -- SearchTours return type -> IEnumerable
- `BL/Interface/ITourLogService.cs` -- unchanged (userId via IUserContext)
- `BL/Interface/IFileService.cs` -- unchanged (userId via IUserContext)
- `DAL/Interface/ITourRepository.cs` -- add userId param
- `DAL/Interface/ITourLogRepository.cs` -- add userId param
- `DAL/Repository/TourRepository.cs` -- filter by userId
- `DAL/Repository/TourLogRepository.cs` -- filter by userId
- `DAL/Infrastructure/TourPlannerContext.cs` -- extend IdentityDbContext, call base.OnModelCreating, add UserId FK, remove seed data
- `DAL/PersistenceModel/TourPersistence.cs` -- add UserId
- `DAL/PersistenceModel/TourLogPersistence.cs` -- add UserId
- `API/Controllers/TourController.cs` -- add [Authorize]
- `API/Controllers/TourLogController.cs` -- add [Authorize]
- `API/Endpoints/ReportEndpoints.cs` -- add authorization, IUserContext as delegate param
- `API/Endpoints/RouteEndpoints.cs` -- add authorization
- `API/Program.cs` -- register Identity on builder.Services, register IUserContext as scoped, add auth middleware, map AuthEndpoints

### Frontend (new)

- `src/app/core/auth/auth-api.service.ts`
- `src/app/core/auth/auth-state.service.ts`
- `src/app/core/auth/auth.guard.ts`
- `src/app/core/auth/auth.interceptor.ts`
- `src/app/features/auth/pages/login-page.component.ts`
- `src/app/features/auth/pages/login-page.component.html`
- `src/app/features/auth/pages/login-page.component.css`
- `src/app/features/auth/pages/register-page.component.ts`
- `src/app/features/auth/pages/register-page.component.html`
- `src/app/features/auth/pages/register-page.component.css`
- `src/app/features/auth/viewmodels/auth.viewmodel.ts`
- `src/app/features/auth/models/auth.model.ts`

### Frontend (modified)

- `src/app/features/tours/models/tour.model.ts` -- remove computed functions, TourView, toTourView
- `src/app/features/tours/viewmodels/tour.viewmodel.ts` -- remove toTourView mapping
- `src/app/features/tours/components/tour-list.component.ts` -- use Tour instead of TourView
- `src/app/features/tours/models/tour.model.spec.ts` -- update tests for removed functions
- `src/app/features/tours/viewmodels/tour.viewmodel.spec.ts` -- update tests
- `src/app/features/tours/components/tour-list.component.spec.ts` -- update TourView -> Tour
- `src/app/app.config.ts` -- register interceptor, withCredentials
- `src/app/app.routes.ts` -- add auth routes, apply guard
- `src/app/layout/navbar/app-navbar.component.ts` -- show user/logout

---

## Design Patterns Documented

For the protocol, this design uses:

- **MVVM** -- frontend ViewModels per feature, dumb components
- **Repository** -- DAL repositories with userId-scoped queries
- **Service Layer** -- BL services with domain logic
- **Adapter** -- OpenRouteServiceRepository wraps external API
- **Mapper** -- Mapster for DTO/Domain/Persistence conversions
- **Facade** -- AuthState as cross-cutting auth facade (distinct from AuthViewModel)
