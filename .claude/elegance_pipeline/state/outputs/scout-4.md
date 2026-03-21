# Scout-4 Elegance Evaluation

## Candidate 1

**File:** `/Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs`

**What hard problem does it solve cleanly?**
Derives three non-trivial computed tour statistics (popularity, child-friendliness, average rating) directly from the logs collection using pure expression-body properties, so no service layer or DTO projection is ever needed to answer these questions.

**Best demonstrating line range:** Lines 17-23
```csharp
public int PopularityScore => Logs.Count;

public bool IsChildFriendly =>
    Logs.Count > 0 && Logs.TrueForAll(static l => l.Difficulty <= 2.0 && l.Rating >= 3.0);

public double? AverageRating =>
    Logs.Count > 0 ? Logs.Average(static l => l.Rating) : null;
```

**What a junior would likely get wrong:** They would define these as methods or push the logic into a service, duplicating it across PDF generation, search, and DTO mapping instead of having one authoritative source on the domain object.

**Difficulty:** 5
**Cleanliness:** 9
**Combined:** 7

---

## Candidate 2

**File:** `/Users/ancplua/swen2-tourplanner-angular/API/Endpoints/AuthEndpoints.cs`

**What hard problem does it solve cleanly?**
Implements the full cookie-based auth lifecycle (register, login, logout, session probe) using minimal API endpoints with typed result unions, keeping each handler a straight-line function that composes ASP.NET Identity without any controller ceremony.

**Best demonstrating line range:** Lines 19-33
```csharp
private static async Task<Results<Ok, ValidationProblem>> Register(
    RegisterRequest request,
    UserManager<IdentityUser> userManager)
{
    var user = new IdentityUser { UserName = request.Email, Email = request.Email };
    var result = await userManager.CreateAsync(user, request.Password);

    if (result.Succeeded) return TypedResults.Ok();

    var errors = result.Errors
        .GroupBy(static e => e.Code)
        .ToDictionary(static g => g.Key, static g => g.Select(static e => e.Description).ToArray());

    return TypedResults.ValidationProblem(errors);
}
```

**What a junior would likely get wrong:** They would return a plain `IResult` or `IActionResult` instead of the union type `Results<Ok, ValidationProblem>`, losing compile-time OpenAPI metadata and making the success/failure contract invisible to the type system.

**Difficulty:** 6
**Cleanliness:** 8
**Combined:** 7

---

## Candidate 3

**File:** `/Users/ancplua/swen2-tourplanner-angular/src/app/features/tours/viewmodels/tour.viewmodel.ts`

**What hard problem does it solve cleanly?**
Manages the full tour CRUD lifecycle including selection-stability after reload, create-vs-update branching, and derived map coordinates from opaque JSON — all expressed as Angular signals/computed with no external state library.

**Best demonstrating line range:** Lines 56-63 (selection-stability after reload) and 34-48 (JSON parsing with graceful fallback)
```typescript
readonly mapCoordinates = computed(() => {
  const tour = this.selectedTour();
  if (!tour?.routeInformation) return null;
  try {
    const info = JSON.parse(tour.routeInformation);
    return { ... };
  } catch {
    return null;
  }
});
```

**What a junior would likely get wrong:** After saving, they would blindly reset `selectedTourId` to null rather than preserving the current selection when it still exists in the reloaded list (lines 58-63).

**Difficulty:** 6
**Cleanliness:** 7
**Combined:** 6

---

## Best in scope:

`/Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs`

The file is short but absolutely non-trivial: it collapses three cross-cutting business rules (popularity, child-friendliness, average rating) into single-line computed properties on the domain object, which then propagate free of charge through all consumers (search, PDF, DTO mapping). That compression ratio — three requirements that would otherwise require service methods or mapping hooks — earns it the top spot.

---

## Weaknesses in scope:

- **`FormatPopularity` is copy-pasted three times.** The identical switch expression appears in `BL/Service/TourService.cs` line 70, `BL/Service/PdfReportService.cs` line 92, and `BL/Mapper/MappingConfiguration.cs` line 37. It belongs on `TourDomain` or a shared static helper, not scattered across layers.
- **Repeated try/catch boilerplate in Angular viewmodels.** Every async action in `TourViewModel`, `TourLogViewModel`, `ReportViewModel`, and `AuthViewModel` follows the exact same `isLoading.set(true)` / try / catch / finally pattern. A generic `withLoading` helper would remove ~60 lines of duplication.
- **`window.confirm` and `window.location.href` in service/viewmodel classes.** Both `TourViewModel.deleteTour` and `auth.interceptor.ts` reach directly into browser globals, making the classes untestable and violating the MVVM contract that views own side effects.
- **`OpenRouteServiceRepository` re-creates the HTTP client headers on every call** instead of configuring a named `HttpClient` with base address and auth header via `IHttpClientFactory` configuration, leading to repeated boilerplate that the factory pattern is designed to eliminate.
