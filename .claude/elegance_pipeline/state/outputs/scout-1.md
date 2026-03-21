## Candidate 1

**File:** /Users/ancplua/swen2-tourplanner-angular/API/Endpoints/AuthEndpoints.cs

**What hard problem does it solve cleanly?**
It expresses four distinct authentication flows (register, login, logout, session-check) with typed result unions and correct Identity error reshaping, in a single self-contained file with zero boilerplate controller scaffolding.

**Line range that best demonstrates elegance:** Lines 27-33
The register error path groups Identity's flat error list by code and converts it into an RFC 7807 ValidationProblem dictionary in three chained LINQ calls, with no intermediate state.

**What a junior would likely get wrong:**
A junior would return a plain `BadRequest` string instead of using `TypedResults.ValidationProblem`, losing the structured error shape that clients (and OpenAPI) depend on; or would skip `GroupBy` and produce duplicate keys when Identity emits multiple errors under the same code.

**Difficulty:** 6
**Cleanliness:** 8
**Combined score:** 7

---

## Candidate 2

**File:** /Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs

**What hard problem does it solve cleanly?**
It encodes three non-trivial business rules (popularity ranking, child-friendliness across all logs, average rating with null-safe aggregate) as pure computed properties derived solely from the aggregate's own collection, keeping business logic in the domain and not in a service.

**Line range that best demonstrates elegance:** Lines 17-23
All three computed properties are expressed as single-expression members; `IsChildFriendly` folds two simultaneous constraints across every log via `TrueForAll`, and `AverageRating` handles the empty-collection edge case inline with a ternary null guard.

**What a junior would likely get wrong:**
A junior would push these calculations into the service layer or a separate helper class, breaking the aggregate's self-containment, or would forget the `Logs.Count > 0` guard before `Average`, which throws `InvalidOperationException` on an empty sequence.

**Difficulty:** 5
**Cleanliness:** 9
**Combined score:** 7

---

## Candidate 3

**File:** /Users/ancplua/swen2-tourplanner-angular/DAL/Adapter/OpenRouteServiceRepository.cs

**What hard problem does it solve cleanly?**
It integrates an external routing API whose coordinate convention (longitude first) is the opposite of the domain model's convention (latitude first), resolves the transport-type string to an API path segment, and extracts a deeply nested JSON response, all within a single focused method with no mapper dependency.

**Line range that best demonstrates elegance:** Lines 28-47
The coordinate inversion (`[from.Longitude, from.Latitude]`) is handled inline in the serialized anonymous object; the JSON navigation to `routes[0].summary` is done directly on a `JsonDocument` without deserializing a full DTO; and the value-tuple return keeps the calling interface clean.

**What a junior would likely get wrong:**
A junior would likely get the longitude/latitude order wrong (a silent data bug), or would deserialize the entire ORS response JSON into a model class just to read two scalar values, creating unnecessary coupling to the third-party response schema.

**Difficulty:** 6
**Cleanliness:** 7
**Combined score:** 7

---

## Best in scope

/Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs

## Weaknesses in scope

- **`FormatPopularity` is triplicated.** The same switch expression appears independently in `PdfReportService.cs`, `MappingConfiguration.cs`, and `TourService.cs`. It belongs in `TourDomain` or a shared static helper; as written it will drift.
- **`TourService.SearchTours` hits the database twice unconditionally.** It always fetches all tours a second time even when `searchText` is empty, and the deduplication guard (`!dbResults.Any(r => r.Id == t.Id)`) runs O(n*m) in memory where a set lookup would suffice.
- **ViewModels use `window.confirm` and `window.location.href` directly.** `TourViewModel.deleteTour` and `auth.interceptor.ts` reach into the browser globals, making the view-models untestable without a DOM and coupling them to navigation side-effects that belong in a dedicated service.
- **`buildTourForSave` in `tour.model.ts` calls `getCityCoordinates` twice (lines 90-91), then calls it again inside `TourViewModel.prepareTourForSave` (lines 136-137) before passing the result to `buildTourForSave`.** The coordinate lookup is done three times for a single save, and the viewmodel re-does work that the model function already performs internally.
