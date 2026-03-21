## Candidate 1

**File:** `/Users/ancplua/swen2-tourplanner-angular/API/Endpoints/AuthEndpoints.cs`

**What hard problem does it solve cleanly?**
Maps the full cookie-based authentication lifecycle (register, login, logout, session probe) to minimal-surface Minimal API endpoints, with typed result unions that encode every possible HTTP outcome in the return type.

**Best demonstrating line range:** Lines 19-33 (Register handler) — IdentityResult errors are folded into a grouped dictionary in a single LINQ pipeline and returned as a typed ValidationProblem, so the compiler knows both success and failure shapes.

**What a junior would likely get wrong here:** Returning a generic `BadRequest` instead of `TypedResults.ValidationProblem`, losing the structured error dictionary and the compile-time result-union contract.

**Difficulty:** 7
**Cleanliness:** 9
**Combined score:** 8

---

## Candidate 2

**File:** `/Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs`

**What hard problem does it solve cleanly?**
Derives three business-rule computed properties — popularity, child-friendliness, and average rating — entirely from the log collection without any external service, using expression-bodied members that read as business rules, not code.

**Best demonstrating line range:** Lines 17-24 — three computed properties, each a one-liner that captures a non-trivial domain invariant (`IsChildFriendly` requires all logs to satisfy both a difficulty cap and a minimum rating simultaneously).

**What a junior would likely get wrong here:** Storing these as mutable fields or recalculating them imperatively in a service method, scattering domain logic outside the aggregate root.

**Difficulty:** 6
**Cleanliness:** 10
**Combined score:** 8

---

## Candidate 3

**File:** `/Users/ancplua/swen2-tourplanner-angular/DAL/Adapter/OpenRouteServiceRepository.cs`

**What hard problem does it solve cleanly?**
Integrates an external GeoJSON routing API, handles transport-type-to-endpoint mapping, and parses a nested JSON response into a typed tuple — all in a single focused method with no intermediate DTOs.

**Best demonstrating line range:** Lines 28-47 — the request payload is built as an anonymous object serialized inline, the transport mapping is a clean switch expression, and the response is streamed and parsed in one chain without a DTO class.

**What a junior would likely get wrong here:** Deserializing the full response into a generated DTO class instead of projecting directly from `JsonDocument`, adding unnecessary allocation and coupling to the external schema.

**Difficulty:** 7
**Cleanliness:** 8
**Combined score:** 7.5

---

## Best in scope:
`/Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs`

## Weaknesses in scope:

- `FormatPopularity` is duplicated verbatim across `BL/Mapper/MappingConfiguration.cs`, `BL/Service/TourService.cs`, and `BL/Service/PdfReportService.cs` — it belongs on `TourDomain` as a computed property like the other derived values.
- The TypeScript viewmodels (`TourViewModel`, `TourLogViewModel`, `ReportViewModel`) share the same isLoading/isSaving/errorMessage pattern with nearly identical try/finally blocks; a generic `withLoading<T>` helper would remove the repetition without hiding the logic.
- `buildTourForSave` in `tour.model.ts` calls `getCityCoordinates` twice (once in the viewmodel at line 136-137 and once inside the function at lines 90-91), making two lookups for the same coordinates in the same save flow.
- `TourService.SearchTours` calls `GetAllTours` to fetch all records for computed-field matching after already calling `SearchToursAsync`, causing two full database round-trips per search; the computed match should be evaluated on results already in memory from the first query.
