# SWEN2 TourPlanner — Grading Checklist

Source: `docs/semester-project.pdf`
Last audited: 2026-04-13
Legend: ✅ done · ⚠️ partial / spec mismatch · ❌ missing (student owns)

---

## Must-Haves (0 points if any missing)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Web framework for frontend (Angular) | ✅ | Angular 21 standalone, `package.json`, `src/` |
| 2 | Middleware backend (ASP.NET) | ✅ | .NET 10, `API/Program.cs` |
| 3 | Layer-based architecture | ✅ | `API/` · `BL/` · `DAL/` · `Contracts/` |
| 4 | At least one design pattern (+ protocol mention) | ✅ code / ❌ protocol | Repository, DI (Autofac), Mapper (Mapster), Strategy (ORS transport switch), AOP decorator (Fody) — protocol PDF does not yet exist |
| 5 | O/R-mapper → PostgreSQL | ✅ | EF Core 10 + Npgsql, `DAL/Infrastructure/TourPlannerContext.cs`, `DAL/Migrations/` |
| 6 | Config separated from source | ✅ | `API/appsettings.json` (DB conn, image path, ORS key), env vars in `compose.yaml` |
| 7 | OpenRouteService integration | ✅ | `DAL/Adapter/OpenRouteServiceRepository.cs` (see feature #4 for the geometry gap) |
| 8 | Leaflet integration | ✅ | `frontend/src/app/features/tours/components/tour-map.component.ts` — now draws the real ORS route geometry as a Leaflet polyline (2026-04-13 fix) |
| 9 | Logging framework | ✅ | Serilog (accepted as "another .NET Microsoft.Extensions-Solution" per the spec) |
| 10 | ≥ 20 unit tests | ✅ | **170 C# tests** (NUnit) + **259 Angular specs** (Vitest) |

---

## Goals (graded)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| G1 | Angular web UI | ✅ | `src/app/` |
| G2 | MVVM pattern in Angular | ✅ | `features/*/viewmodels/*.ts` injected via `inject(XViewModel)` in pages; components use `input()`/`output()` only |
| G3 | Client-server via ASP.NET | ✅ | `API/Program.cs`, controllers + minimal endpoints |
| G4 | 3-layer architecture | ✅ | See must-have #3 |
| G5 | Design patterns in code | ✅ | See must-have #4 |
| G6 | Own reusable web-UI component | ✅ | `src/app/features/search/components/search.component.ts` — used in `app-shell.component.html`, pure `input()`/`output()` |
| G7 | Tour + log data in Postgres via ORM | ✅ | `TourPersistence`, `TourLogPersistence` |
| G7b | Images on filesystem (not DB) | ✅ | `API/Images/tours/*.png`, served via `UseStaticFiles()` |
| G8 | Logging framework | ✅ | See must-have #9 |
| G9 | Unit tests | ✅ | See must-have #10 |
| G10 | Config separated | ✅ | See must-have #6 |
| G11 | Architecture + UML + wireframe docs | ❌ | See "Hand-In / Protocol" section below |

---

## Features

| # | Requirement | Status | Evidence / Gap |
|---|---|---|---|
| F1 | Self-registration + login | ✅ | `API/Endpoints/AuthEndpoints.cs` — register, login, lockout after 5 fails / 5 min |
| F2 | Create tours | ✅ | `TourController.CreateTour` POST `/api/tour` |
| F3 | Tour fields (name, description, from, to, transport type, distance, estimated time, route info) | ✅ | `BL/DomainModel/TourDomain.cs` — all 8 fields present |
| F4 | Distance + time from OpenRouteService | ✅ | `OpenRouteServiceRepository.ResolveRouteAsync` now calls the `/geojson` endpoint and returns a `ResolvedRoute(distance, duration, geometry)` record |
| F5 | Graphical tour map via Leaflet | ✅ | `OpenRouteServiceRepository` pulls the full `LineString` coordinates from `features[0].geometry.coordinates`. `RouteService` + `RouteEndpoints` pass the geometry through to the frontend via `ResolveRouteResponse.geometry`. `buildTourForSave` persists it on `routeInformation`, `TourViewModel.mapCoordinates` exposes it, and `tour-map.component.ts` draws a real polyline from the coordinate array (falling back to the straight-line dashed path only when no geometry is stored). (2026-04-13 fix) |
| F6 | Tour CRUD | ✅ | `TourController` — POST / GET / GET{id} / PUT / DELETE |
| F7 | Create new tour logs | ✅ | `TourLogController` + `TourLogService` |
| F8 | Multiple logs per tour | ✅ | `TourLogPersistence.TourPersistenceId` FK, `Include(t => t.TourLogPersistence)` |
| F9 | Tour log fields (date/time, comment, difficulty, total distance, total time, rating) | ✅ | `BL/DomainModel/TourLogDomain.cs` — all 6 fields |
| F10 | Tour log CRUD | ✅ | `TourLogController` endpoints |
| F11 | Single-user ownership, no sharing | ✅ | `UserId` FK on both entities, all repository queries filter by `userId`, `IUserContext` resolved from `ClaimTypes.NameIdentifier` |
| F12 | Validated input | ✅ | `[Required]`, `[Range]`, `[EmailAddress]` on `TourDto` / `TourLogDto` / `RegisterRequest`; Angular reactive-form validators mirror them |
| F13 | Full-text search in tour + tour-log data | ✅ | `TourService.SearchTours` → `TourDomain.SearchableText` (includes log comments) |
| F14 | Computed **popularity** (from log count) | ✅ | `TourDomain.PopularityScore = Logs.Count`, `FormattedPopularity` switch expression |
| F15 | Computed **child-friendliness** (from difficulty, total times, distance) | ✅ | `TourDomain.IsChildFriendly` now derives from the three signals the spec names: `Logs.Average(Difficulty) ≤ 2.0 && Logs.Average(TotalTime) ≤ 120 && Logs.Average(TotalDistance) ≤ 10`. Rating is no longer part of the formula. Thresholds are tunable and should be justified in the protocol. (2026-04-13 fix) |
| F16 | Full-text search also considers computed values | ✅ | **Fixed 2026-04-13.** `SearchableText` now emits `FormattedPopularity`, `PopularityScore`, `"child-friendly"` token when true, and `AverageRating` formatted `F1`. Verified end-to-end via Playwright (8/8 search queries). |
| F17 | Import + export of tour data | ✅ | `ReportEndpoints` POST `/api/reports/import`, GET `/api/reports/export/{tourId}` — JSON |
| F18 | Unique feature | ✅ | **PDF reports via QuestPDF** — `BL/Service/PdfReportService.cs` generates per-tour and summary reports with embedded images. UI: `reports-page.component.ts` |

---

## UI

| # | Requirement | Status | Evidence |
|---|---|---|---|
| UI1 | Own UI design covering all functionality | ✅ | Angular components + custom CSS, tours / tour-logs / reports / auth pages, reusable search |
| UI2 | **Wireframe** in documentation (mandatory) | ❌ | `docs/` contains screenshots of the finished UI, not wireframes. Spec explicitly says *wireframe of your design* — student must add hand-drawn / Figma / Excalidraw mockups. |

---

## Hand-In / Protocol (all student deliverables — code cannot provide these)

| # | Requirement | Status |
|---|---|---|
| P1 | Protocol PDF (technical steps, decisions, failures, chosen solutions) | ❌ |
| P2 | UML use case diagram | ❌ |
| P3 | Wireframes of UI flow | ❌ |
| P4 | UML class diagram | ❌ |
| P5 | UML sequence diagram for **full-text search** | ❌ |
| P6 | Rationale: why these unit tests, why the tested code is critical | ❌ |
| P7 | Time tracking log | ❌ |
| P8 | Git history is documentation (no copy needed) | ✅ |

**Everything in this table is mandatory and non-recoverable in the final presentation.** Code quality alone cannot compensate for a missing protocol PDF.

---

## Priority gaps to close before hand-in

Only the student-owned deliverables remain. All grading-critical **code** gaps are now closed.

1. **Protocol PDF + UML pack + wireframes** (P1–P7, UI2, G11)
   Still the biggest single chunk of missing points. Tools: Figma / Excalidraw / draw.io / PlantUML for the diagrams, any word processor → PDF for the protocol.
   The sequence diagram for full-text search should reflect the current flow:
   `SearchComponent → SearchViewModel → ToursApiService.searchTours → TourController.SearchTours → TourService.SearchTours → TourRepository.GetAllTours → Mapster → TourDomain.SearchableText filter → IEnumerable<TourDomain> → Mapster → IEnumerable<TourDto>`.
   The class diagram should include the new `ResolvedRoute` record in `Contracts.Routes` and the `SearchableText` computed property on `TourDomain`.

