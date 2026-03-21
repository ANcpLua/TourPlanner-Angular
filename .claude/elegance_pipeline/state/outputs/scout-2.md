## Candidates

### 1. /Users/ancplua/swen2-tourplanner-angular/API/Infrastructure/PostgreSqlHealthCheck.cs

**What hard problem it solves cleanly:** It correctly defends against the subtle failure mode of a health probe hanging indefinitely when Postgres is unreachable by overriding the timeout settings on the connection string itself — rather than relying on the ambient `CancellationToken` alone — all in a single, linear async method with no branching noise.

**Best demonstrating line range:** Lines 25-30 — constructing a new `NpgsqlConnectionStringBuilder` from the existing connection string and overriding `Timeout`, `CommandTimeout`, and `CancellationTimeout` to 1 second each before opening the connection. This is the payload of the whole class; everything else is scaffolding.

**What a junior would likely get wrong:** A junior would omit the `NpgsqlConnectionStringBuilder` rewrite entirely and rely solely on the `CancellationToken` passed by the health-check framework, not realising that the host-default cancellation timeout is often 30 s and that a TCP-level hang can hold the probe open far longer.

**Difficulty:** 7
**Cleanliness:** 9
**Combined:** 8

---

### 2. /Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs

**What hard problem it solves cleanly:** Three derived business attributes — popularity score, child-friendliness, and average rating — are expressed as pure computed properties over the `Logs` collection with no mutation, no cache field, and no service injection; the business rules are entirely co-located with the data they depend on.

**Best demonstrating line range:** Lines 17-23 — the three computed properties `PopularityScore`, `IsChildFriendly`, and `AverageRating`, each a single expression that precisely captures the business rule.

**What a junior would likely get wrong:** A junior would either hoist the computation into the service layer (scattering the rule), or add a backing field and cache-invalidation logic when the collection changes, adding incidental complexity that the immutable-by-convention design makes unnecessary.

**Difficulty:** 6
**Cleanliness:** 10
**Combined:** 8

---

### 3. /Users/ancplua/swen2-tourplanner-angular/API/Endpoints/AuthEndpoints.cs

**What hard problem it solves cleanly:** Full cookie-based auth (register, login with session cookie, logout, current-user probe) is wired end-to-end using minimal-API typed results, with IdentityError grouping collapsed into a `ValidationProblem` in two LINQ expressions and zero controller boilerplate.

**Best demonstrating line range:** Lines 28-32 — the `Register` handler's error path: `result.Errors.GroupBy(static e => e.Code).ToDictionary(...)` collapses arbitrarily many Identity errors into the RFC 7807 validation-problem dictionary in one pipeline, returning a properly typed `ValidationProblem` without any manual loop.

**What a junior would likely get wrong:** A junior would iterate `result.Errors` with a `foreach`, manually build a `Dictionary<string, string[]>`, and return a raw `BadRequest` with a hand-crafted object — losing the typed-result contract and the automatic OpenAPI shape.

**Difficulty:** 7
**Cleanliness:** 8
**Combined:** 8

---

## Best in scope:
/Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs

## Weaknesses in scope:

- `FormatPopularity` is duplicated verbatim across three files (`PdfReportService.cs`, `MappingConfiguration.cs`, and `TourService.cs`); it belongs in a single shared static helper or on the domain model itself.
- The `ReportViewModel` (`report.viewmodel.ts`) repeats the same `isProcessing.set(true) / clearMessages() / try-catch / finally isProcessing.set(false)` scaffolding across four methods with no extraction into a helper that accepts the operation as a lambda.
- `TourLogService.cs` and `TourService.cs` are structurally identical pass-throughs (map -> repository -> map) but neither uses a shared generic base or code-gen; they accumulate parallel boilerplate as entities grow.
- `buildTourForSave` in `tour.model.ts` (lines 90-91) looks up city coordinates twice — once in `prepareTourForSave` on the ViewModel and once inside `buildTourForSave` itself — duplicating a computation that should be done exactly once and passed through.
