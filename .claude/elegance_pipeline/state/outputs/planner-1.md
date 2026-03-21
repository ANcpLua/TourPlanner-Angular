## Verdict
Implementation warranted: yes

## Tasks

### Task 1
- Title: Consolidate FormatPopularity into a single method on TourDomain
- Justification: The exact same switch expression (score switch { >= 4 => "Very popular", 3 => "Popular", 2 => "Moderately popular", 1 => "Less popular", _ => "Not popular" }) is copy-pasted as a private static method in three separate files: TourService.cs (line 70), PdfReportService.cs (line 92), and MappingConfiguration.cs (line 37). Since TourDomain already exposes the numeric PopularityScore as a computed property (line 17), adding a FormattedPopularity string property on TourDomain using the same switch expression is the natural single source of truth. All three call sites already have a TourDomain instance in hand.
- Target files:
  - /Users/ancplua/swen2-tourplanner-angular/BL/DomainModel/TourDomain.cs -- add public string FormattedPopularity => PopularityScore switch { ... };
  - /Users/ancplua/swen2-tourplanner-angular/BL/Service/TourService.cs -- delete FormatPopularity method (lines 70-77), replace FormatPopularity(tour.PopularityScore) at line 65 with tour.FormattedPopularity
  - /Users/ancplua/swen2-tourplanner-angular/BL/Service/PdfReportService.cs -- delete FormatPopularity method (lines 92-99), replace FormatPopularity(tour.PopularityScore) at line 80 with tour.FormattedPopularity
  - /Users/ancplua/swen2-tourplanner-angular/BL/Mapper/MappingConfiguration.cs -- delete FormatPopularity method (lines 37-44), replace FormatPopularity(src.PopularityScore) at line 32 with src.FormattedPopularity
- Intended outcome: One definition of the popularity formatting logic; three fewer private methods; no behavioral change.
- Must not change: The switch expression output values, the PopularityScore numeric property, the TourDto.Popularity mapping output.
- Verification: Build succeeds. Grep for FormatPopularity finds only the single property on TourDomain. Existing tour-related API endpoints return identical popularity strings in their JSON responses.
- Priority: high

### Task 2
- Title: Eliminate double DB query in TourService.SearchTours
- Justification: SearchTours at lines 42-60 of TourService.cs calls tourRepository.SearchToursAsync (line 44) to get DB-field matches, then calls tourRepository.GetAllTours (line 51) to fetch every tour again just to check computed values. The second query is redundant -- the computed-value check (MatchesComputedValues) can run against allTours fetched once, with DB-field matches identified by a Contains/Any check on the search text against string properties, or more simply: fetch all tours once, then partition results into DB-field matches and computed-value matches in memory.
- Target files:
  - /Users/ancplua/swen2-tourplanner-angular/BL/Service/TourService.cs -- rewrite SearchTours to call GetAllTours once, then filter in memory for both DB-field matches (Name, Description, From, To contain searchText) and computed-value matches (MatchesComputedValues). Remove the call to SearchToursAsync from this method.
- Intended outcome: Single DB round-trip instead of two. Same result set. SearchToursAsync on the repository remains available but is no longer called from SearchTours (it may be removed in a future cleanup if unused elsewhere, but that is out of scope).
- Must not change: The search result semantics -- tours matching DB fields (Name, Description, From, To) OR computed values (popularity label, child-friendly) must still be returned. The ITourService.SearchTours signature.
- Verification: Build succeeds. Manual test: search for "popular" returns tours with popularity labels; search for "child" returns child-friendly tours; search for a tour name returns that tour. No duplicate tours in results.
- Priority: high

### Task 3
- Title: Remove double getCityCoordinates lookup in tour save flow
- Justification: In tour.viewmodel.ts, prepareTourForSave calls getCityCoordinates(formValue.from) and getCityCoordinates(formValue.to) at lines 136-137 to build the ResolveRouteRequest. Then buildTourForSave (in tour.model.ts lines 90-91) calls getCityCoordinates again for the same two cities to build the routeInformation JSON. The coordinates are pure functions of the city name, so the lookups are redundant.
- Target files:
  - /Users/ancplua/swen2-tourplanner-angular/src/app/features/tours/models/tour.model.ts -- change buildTourForSave signature to accept the already-resolved coordinates (e.g., fromCoordinates and toCoordinates as parameters) instead of calling getCityCoordinates internally. Remove the two getCityCoordinates calls at lines 90-91.
  - /Users/ancplua/swen2-tourplanner-angular/src/app/features/tours/viewmodels/tour.viewmodel.ts -- in prepareTourForSave, pass fromCoordinates and toCoordinates (already computed at lines 136-137) to buildTourForSave.
- Intended outcome: Each city's coordinates are resolved exactly once per save operation. getCityCoordinates remains exported for other callers.
- Must not change: The shape of the Tour object produced by buildTourForSave. The routeInformation JSON structure. The ResolveRouteRequest construction.
- Verification: Build and lint pass (ng build). Existing save-tour flow produces identical routeInformation JSON. Grep for getCityCoordinates in tour.model.ts confirms it no longer appears inside buildTourForSave.
- Priority: medium
