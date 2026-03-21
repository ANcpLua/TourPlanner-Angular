# Computed Tour Attributes + Cookie Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move computed tour attributes to BL backend and add cookie-based auth with user ownership.

**Architecture:** Two independent changes sharing the same backend. Section 1 (computed attrs) touches BL/Contracts/frontend only. Section 2 (auth) touches all layers. Both backends (Angular + Blazor) are identical -- changes apply to both.

**Tech Stack:** .NET 10, EF Core 10, ASP.NET Identity, Autofac, Mapster, Angular 19, signals

**Spec:** `docs/superpowers/specs/2026-03-20-computed-attrs-auth-design.md`

---

## Section 1: Computed Attributes

### Task 1: Add computed properties to TourDomain

**Files:**
- Modify: `BL/DomainModel/TourDomain.cs`

- [ ] **Step 1: Add computed properties**

```csharp
// BL/DomainModel/TourDomain.cs
namespace BL.DomainModel;

public class TourDomain
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string From { get; set; }
    public required string To { get; set; }
    public required string TransportType { get; set; }
    public string? ImagePath { get; set; }
    public string? RouteInformation { get; set; }
    public double? Distance { get; set; }
    public double? EstimatedTime { get; set; }
    public List<TourLogDomain> Logs { get; set; } = [];

    public int PopularityScore => Logs.Count;

    public bool IsChildFriendly =>
        Logs.Count > 0 && Logs.TrueForAll(l => l.Difficulty <= 2.0 && l.Rating >= 3.0);

    public double? AverageRating =>
        Logs.Count > 0 ? Logs.Average(l => l.Rating) : null;
}
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build BL/BL.csproj`
Expected: Build succeeded

- [ ] **Step 3: Commit**

```bash
git add BL/DomainModel/TourDomain.cs
git commit -m "feat: add computed properties to TourDomain (PopularityScore, IsChildFriendly, AverageRating)"
```

---

### Task 2: Update TourDto + Mapster mapping

**Files:**
- Modify: `Contracts/Tours/TourDto.cs`
- Modify: `BL/Mapper/MappingConfiguration.cs`

- [ ] **Step 1: Add fields to TourDto**

Add these three properties to `Contracts/Tours/TourDto.cs` after the `TourLogs` property:

```csharp
[JsonPropertyName("popularity")]
public string? Popularity { get; set; }

[JsonPropertyName("isChildFriendly")]
public bool IsChildFriendly { get; set; }

[JsonPropertyName("averageRating")]
public double? AverageRating { get; set; }
```

- [ ] **Step 2: Add PopularityScore-to-string mapping in MappingConfiguration**

In `BL/Mapper/MappingConfiguration.cs`, update `ConfigureTourMappings` to add the popularity string conversion. Replace the existing `TourDomain -> TourDto` mapping:

```csharp
config.NewConfig<TourDomain, TourDto>()
    .Map(static dest => dest.TourLogs, static src => src.Logs)
    .Map(static dest => dest.Popularity, static src => FormatPopularity(src.PopularityScore));
```

Add the helper method to `MappingConfiguration`:

```csharp
private static string FormatPopularity(int score) => score switch
{
    >= 4 => "Very popular",
    3 => "Popular",
    2 => "Moderately popular",
    1 => "Less popular",
    _ => "Not popular"
};
```

Note: `IsChildFriendly` and `AverageRating` map automatically by property name match -- no explicit mapping needed.

- [ ] **Step 3: Build to verify**

Run: `dotnet build`
Expected: Build succeeded

- [ ] **Step 4: Commit**

```bash
git add Contracts/Tours/TourDto.cs BL/Mapper/MappingConfiguration.cs
git commit -m "feat: add popularity, isChildFriendly, averageRating to TourDto with Mapster mapping"
```

---

### Task 3: Fix SearchTours return type

**Files:**
- Modify: `BL/Interface/ITourService.cs:12`

- [ ] **Step 1: Change ITourService.SearchTours signature**

In `BL/Interface/ITourService.cs`, change line 12:

```csharp
// Before:
IQueryable<TourDomain> SearchTours(string searchText);

// After:
IEnumerable<TourDomain> SearchTours(string searchText);
```

Note: The `TourService.SearchTours` implementation with in-memory computed filtering is written in Task 10 when the full service is rewritten with `IUserContext`. No intermediate implementation needed -- this task only changes the interface signature.

- [ ] **Step 2: Build to verify**

Run: `dotnet build`
Expected: Build succeeded (TourService still compiles because `IQueryable<T>` is `IEnumerable<T>`)

- [ ] **Step 3: Commit**

```bash
git add BL/Interface/ITourService.cs
git commit -m "feat: change SearchTours return type from IQueryable to IEnumerable"
```

---

### Task 4: Update PdfReportService to render computed attributes

**Files:**
- Modify: `BL/Service/PdfReportService.cs:63-81`

- [ ] **Step 1: Add computed rows to AddTourDetails**

In `BL/Service/PdfReportService.cs`, add three rows at the end of the `AddTourDetails` method (after the "Transport:" row):

```csharp
AddTableRow(table, "Popularity:", FormatPopularity(tour.PopularityScore));
AddTableRow(table, "Child-friendly:", tour.IsChildFriendly ? "Yes" : "No");
AddTableRow(table, "Avg. Rating:", tour.AverageRating?.ToString("N1", CultureInfo.InvariantCulture) ?? "N/A");
```

Add the helper method to `PdfReportService`:

```csharp
private static string FormatPopularity(int score) => score switch
{
    >= 4 => "Very popular",
    3 => "Popular",
    2 => "Moderately popular",
    1 => "Less popular",
    _ => "Not popular"
};
```

- [ ] **Step 2: Build to verify**

Run: `dotnet build BL/BL.csproj`
Expected: Build succeeded

- [ ] **Step 3: Commit**

```bash
git add BL/Service/PdfReportService.cs
git commit -m "feat: render popularity, child-friendliness, avg rating in PDF reports"
```

---

### Task 5: Frontend cleanup -- remove TourView and computed functions

**Files:**
- Modify: `src/app/features/tours/models/tour.model.ts`
- Modify: `src/app/features/tours/viewmodels/tour.viewmodel.ts`
- Modify: `src/app/features/tours/components/tour-list.component.ts`
- Modify: `src/app/features/tours/components/tour-list.component.html` (if references TourView)
- Modify: `src/app/features/tours/models/tour.model.spec.ts`
- Modify: `src/app/features/tours/viewmodels/tour.viewmodel.spec.ts`
- Modify: `src/app/features/tours/components/tour-list.component.spec.ts`

- [ ] **Step 1: Update Tour type to include backend-computed fields**

In `src/app/features/tours/models/tour.model.ts`:

1. Add `popularity`, `averageRating`, `isChildFriendly` to the `Tour` type (these come from the DTO now)
2. Remove: `TourView` interface, `toTourView()`, `getPopularity()`, `getAverageRating()`, `getIsChildFriendly()`

The `Tour` type becomes:

```typescript
export type Tour = Omit<
  TourDto,
  'id' | 'name' | 'description' | 'from' | 'to' | 'transportType'
> & {
  id: string;
  name: string;
  description: string;
  from: string;
  to: string;
  transportType: TransportType;
  popularity?: string;
  isChildFriendly?: boolean;
  averageRating?: number | null;
};
```

Keep: `TourFormValue`, `CITY_COORDINATES`, `CITY_OPTIONS`, `getCityCoordinates`, `createEmptyTourFormValue`, `createTourFormValue`, `buildTourForSave`, `ResolveRouteRequest`, `ResolveRouteResponse`.

- [ ] **Step 2: Update TourViewModel**

In `src/app/features/tours/viewmodels/tour.viewmodel.ts`:

1. Remove `toTourView` import
2. Change `tours` computed:

```typescript
// Before:
readonly tours = computed(() => this.rawTours().map(toTourView));

// After:
readonly tours = computed(() => this.rawTours());
```

3. Update all type references from `TourView` to `Tour` (the `selectedTour`, `editingTour` computeds already return from `this.tours()` which is now `Tour[]`)

- [ ] **Step 3: Update TourListComponent**

In `src/app/features/tours/components/tour-list.component.ts`:

1. Change import from `TourView` to `Tour`
2. Update input/output types:

```typescript
readonly tours = input.required<readonly Tour[]>();
readonly selectTour = output<Tour>();
readonly editTour = output<Tour>();
readonly deleteTour = output<Tour>();

protected trackTour(_: number, tour: Tour): string {
    return tour.id;
}
```

- [ ] **Step 4: Update test files**

Update `tour.model.spec.ts`: remove tests for `getPopularity`, `getAverageRating`, `getIsChildFriendly`, `toTourView`. These functions no longer exist -- the logic is now in the C# backend.

Update `tour.viewmodel.spec.ts`: remove any references to `TourView`, update mocks to include `popularity`, `isChildFriendly`, `averageRating` in the mock tour data.

Update `tour-list.component.spec.ts`: change `TourView` references to `Tour`.

- [ ] **Step 5: Build Angular to verify**

Run: `npx ng build`
Expected: Build succeeded

- [ ] **Step 6: Run Angular tests**

Run: `npx ng test --watch=false`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/app/features/tours/
git commit -m "feat: remove frontend computed logic, consume backend-computed popularity/childFriendly/averageRating"
```

---

## Section 2: Cookie Auth

### Task 6: Add Identity package to DAL via CPM

**Files:**
- Modify: `Version.props`
- Modify: `Directory.Packages.props`
- Modify: `DAL/DAL.csproj`

- [ ] **Step 1: Add FrameworkReference to DAL.csproj**

`DAL.csproj` is a class library (`Microsoft.NET.Sdk`). `IdentityDbContext` lives in the ASP.NET Core shared framework. Add a `FrameworkReference` so DAL can use Identity types:

```xml
<!-- DAL/DAL.csproj -- add this ItemGroup -->
<ItemGroup>
    <FrameworkReference Include="Microsoft.AspNetCore.App"/>
</ItemGroup>
```

No NuGet package or CPM entry needed -- `Microsoft.AspNetCore.Identity.EntityFrameworkCore` is included in the framework reference.

- [ ] **Step 2: Build to verify**

Run: `dotnet build DAL/DAL.csproj`
Expected: Build succeeded

- [ ] **Step 3: Commit**

```bash
git add DAL/DAL.csproj
git commit -m "chore: add ASP.NET Core FrameworkReference to DAL for Identity support"
```

---

### Task 7: Update persistence models + DbContext for Identity

**Files:**
- Modify: `DAL/PersistenceModel/TourPersistence.cs`
- Modify: `DAL/PersistenceModel/TourLogPersistence.cs`
- Modify: `DAL/Infrastructure/TourPlannerContext.cs`

- [ ] **Step 1: Add UserId to TourPersistence**

```csharp
// Add to TourPersistence.cs after EstimatedTime:
[Required] public required string UserId { get; set; }
```

- [ ] **Step 2: Add UserId to TourLogPersistence**

```csharp
// Add to TourLogPersistence.cs after TourPersistenceId:
[Required] public required string UserId { get; set; }
```

- [ ] **Step 3: Update TourPlannerContext to extend IdentityDbContext**

```csharp
using DAL.PersistenceModel;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DAL.Infrastructure;

public class TourPlannerContext(DbContextOptions<TourPlannerContext> options)
    : IdentityDbContext<IdentityUser>(options)
{
    public DbSet<TourPersistence> ToursPersistence { get; set; } = null!;
    public DbSet<TourLogPersistence> TourLogsPersistence { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TourPersistence>(static entity =>
        {
            entity.ToTable("Tours");
            entity.HasKey(static t => t.Id);
            entity.Property(static t => t.Name).IsRequired().HasMaxLength(200);
            entity.Property(static t => t.Description).IsRequired().HasMaxLength(500);
            entity.Property(static t => t.From).IsRequired().HasMaxLength(100);
            entity.Property(static t => t.To).IsRequired().HasMaxLength(100);
            entity.Property(static t => t.Distance).HasColumnType("decimal(18,2)");
            entity.Property(static t => t.EstimatedTime);
            entity.Property(static t => t.TransportType).HasMaxLength(50);
            entity.Property(static t => t.ImagePath).HasMaxLength(10000);
            entity.Property(static t => t.RouteInformation).HasMaxLength(30000);
            entity.Property(static t => t.UserId).IsRequired().HasMaxLength(450);

            entity
                .HasMany(static t => t.TourLogPersistence)
                .WithOne(static tl => tl.TourPersistence)
                .HasForeignKey(static tl => tl.TourPersistenceId);
        });

        modelBuilder.Entity<TourLogPersistence>(static entity =>
        {
            entity.ToTable("TourLogs");
            entity.HasKey(static tl => tl.Id);
            entity
                .Property(static tl => tl.DateTime)
                .HasConversion(
                    static v => DateTime.SpecifyKind(v, DateTimeKind.Utc),
                    static v => v.ToUniversalTime()
                );
            entity.Property(static tl => tl.Comment).IsRequired().HasMaxLength(500);
            entity.Property(static tl => tl.Difficulty);
            entity.Property(static tl => tl.Rating);
            entity.Property(static tl => tl.TotalDistance).HasColumnType("decimal(18,2)");
            entity.Property(static tl => tl.TotalTime);
            entity.Property(static tl => tl.UserId).IsRequired().HasMaxLength(450);

            entity
                .HasOne(static tl => tl.TourPersistence)
                .WithMany(static t => t.TourLogPersistence)
                .HasForeignKey(static tl => tl.TourPersistenceId);
        });

        // Seed data removed -- users create their own tours after registration
    }
}
```

- [ ] **Step 4: Build to verify**

Run: `dotnet build DAL/DAL.csproj`
Expected: Build succeeded

- [ ] **Step 5: Commit**

```bash
git add DAL/PersistenceModel/TourPersistence.cs DAL/PersistenceModel/TourLogPersistence.cs DAL/Infrastructure/TourPlannerContext.cs
git commit -m "feat: extend IdentityDbContext, add UserId FK to Tour/TourLog persistence models"
```

---

### Task 8: Add IUserContext interface + UserContext implementation

**Files:**
- Create: `BL/Interface/IUserContext.cs`
- Create: `API/Infrastructure/UserContext.cs`

- [ ] **Step 1: Create IUserContext**

```csharp
// BL/Interface/IUserContext.cs
namespace BL.Interface;

public interface IUserContext
{
    string UserId { get; }
}
```

- [ ] **Step 2: Create UserContext implementation**

```csharp
// API/Infrastructure/UserContext.cs
using System.Security.Claims;
using BL.Interface;

namespace API.Infrastructure;

public class UserContext(IHttpContextAccessor httpContextAccessor) : IUserContext
{
    public string UserId =>
        httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException("User is not authenticated.");
}
```

- [ ] **Step 3: Build to verify**

Run: `dotnet build`
Expected: Build succeeded

- [ ] **Step 4: Commit**

```bash
git add BL/Interface/IUserContext.cs API/Infrastructure/UserContext.cs
git commit -m "feat: add IUserContext interface and scoped UserContext implementation"
```

---

### Task 9: Update repository interfaces + implementations with userId

**Files:**
- Modify: `DAL/Interface/ITourRepository.cs`
- Modify: `DAL/Interface/ITourLogRepository.cs`
- Modify: `DAL/Repository/TourRepository.cs`
- Modify: `DAL/Repository/TourLogRepository.cs`

- [ ] **Step 1: Update ITourRepository**

```csharp
using DAL.PersistenceModel;

namespace DAL.Interface;

public interface ITourRepository
{
    Task<TourPersistence> CreateTourAsync(TourPersistence tour, string userId, CancellationToken cancellationToken = default);
    IEnumerable<TourPersistence> GetAllTours(string userId);
    TourPersistence? GetTourById(Guid id, string userId);
    Task<TourPersistence> UpdateTourAsync(TourPersistence tour, string userId, CancellationToken cancellationToken = default);
    Task DeleteTourAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    IQueryable<TourPersistence> SearchToursAsync(string searchText, string userId);
}
```

- [ ] **Step 2: Update ITourLogRepository**

```csharp
using DAL.PersistenceModel;

namespace DAL.Interface;

public interface ITourLogRepository
{
    Task<TourLogPersistence> CreateTourLogAsync(TourLogPersistence newTourLogPersistence, string userId, CancellationToken cancellationToken = default);
    IEnumerable<TourLogPersistence> GetTourLogsByTourId(Guid tourId, string userId);
    TourLogPersistence? GetTourLogById(Guid id, string userId);
    Task<TourLogPersistence> UpdateTourLogAsync(TourLogPersistence updatedTourLogPersistence, string userId, CancellationToken cancellationToken = default);
    Task DeleteTourLogAsync(Guid id, string userId, CancellationToken cancellationToken = default);
}
```

- [ ] **Step 3: Update TourRepository implementation**

All queries add `.Where(t => t.UserId == userId)`. Create sets `tour.UserId = userId`. Full replacement:

```csharp
using DAL.Infrastructure;
using DAL.Interface;
using DAL.PersistenceModel;
using Microsoft.EntityFrameworkCore;

namespace DAL.Repository;

public class TourRepository(TourPlannerContext dbContext) : ITourRepository
{
    public async Task<TourPersistence> CreateTourAsync(TourPersistence tour, string userId,
        CancellationToken cancellationToken = default)
    {
        tour.UserId = userId;
        dbContext.Set<TourPersistence>().Add(tour);
        await dbContext.SaveChangesAsync(cancellationToken);
        return tour;
    }

    public IEnumerable<TourPersistence> GetAllTours(string userId)
    {
        return [.. dbContext
            .Set<TourPersistence>()
            .Where(t => t.UserId == userId)
            .Include(t => t.TourLogPersistence)];
    }

    public TourPersistence? GetTourById(Guid id, string userId)
    {
        return dbContext
            .Set<TourPersistence>()
            .Where(t => t.UserId == userId)
            .Include(t => t.TourLogPersistence)
            .FirstOrDefault(t => t.Id == id);
    }

    public async Task<TourPersistence> UpdateTourAsync(TourPersistence tour, string userId,
        CancellationToken cancellationToken = default)
    {
        tour.UserId = userId;
        dbContext.Set<TourPersistence>().Update(tour);
        await dbContext.SaveChangesAsync(cancellationToken);
        return tour;
    }

    public async Task DeleteTourAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        var tour = await dbContext.Set<TourPersistence>()
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, cancellationToken);
        if (tour is not null)
        {
            dbContext.Set<TourPersistence>().Remove(tour);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public IQueryable<TourPersistence> SearchToursAsync(string searchText, string userId)
    {
        var query = dbContext.ToursPersistence
            .Where(t => t.UserId == userId)
            .Include(t => t.TourLogPersistence);

        if (string.IsNullOrWhiteSpace(searchText)) return query;

        return query.Where(t =>
            t.Name.Contains(searchText) ||
            t.Description.Contains(searchText) ||
            t.From.Contains(searchText) ||
            t.To.Contains(searchText) ||
            t.TourLogPersistence.Any(tl => tl.Comment.Contains(searchText))
        );
    }
}
```

- [ ] **Step 4: Update TourLogRepository implementation**

Same pattern -- all queries add userId filter. Full replacement:

```csharp
using DAL.Infrastructure;
using DAL.Interface;
using DAL.PersistenceModel;
using Microsoft.EntityFrameworkCore;

namespace DAL.Repository;

public class TourLogRepository(TourPlannerContext dbContext) : ITourLogRepository
{
    public async Task<TourLogPersistence> CreateTourLogAsync(TourLogPersistence newTourLogPersistence, string userId,
        CancellationToken cancellationToken = default)
    {
        newTourLogPersistence.UserId = userId;
        dbContext.TourLogsPersistence.Add(newTourLogPersistence);
        await dbContext.SaveChangesAsync(cancellationToken);
        return newTourLogPersistence;
    }

    public IEnumerable<TourLogPersistence> GetTourLogsByTourId(Guid tourId, string userId)
    {
        return [.. dbContext
            .TourLogsPersistence
            .Where(t => t.TourPersistenceId == tourId && t.UserId == userId)];
    }

    public TourLogPersistence? GetTourLogById(Guid id, string userId)
    {
        return dbContext.TourLogsPersistence
            .FirstOrDefault(t => t.Id == id && t.UserId == userId);
    }

    public async Task<TourLogPersistence> UpdateTourLogAsync(TourLogPersistence updatedTourLogPersistence, string userId,
        CancellationToken cancellationToken = default)
    {
        updatedTourLogPersistence.UserId = userId;
        dbContext.TourLogsPersistence.Update(updatedTourLogPersistence);
        await dbContext.SaveChangesAsync(cancellationToken);
        return updatedTourLogPersistence;
    }

    public async Task DeleteTourLogAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        var tourLogPersistence =
            await dbContext.TourLogsPersistence.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, cancellationToken);
        if (tourLogPersistence is not null)
        {
            dbContext.TourLogsPersistence.Remove(tourLogPersistence);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
```

- [ ] **Step 5: Build to verify**

Run: `dotnet build DAL/DAL.csproj`
Expected: Build succeeded

- [ ] **Step 6: Commit**

```bash
git add DAL/Interface/ DAL/Repository/
git commit -m "feat: add userId param to all repository interfaces and implementations"
```

---

### Task 10: Update BL services to use IUserContext

**Files:**
- Modify: `BL/Service/TourService.cs`
- Modify: `BL/Service/TourLogService.cs`
- Modify: `BL/Service/FileService.cs`

- [ ] **Step 1: Update TourService**

Add `IUserContext userContext` to constructor. Pass `userContext.UserId` to all repository calls:

```csharp
using BL.DomainModel;
using BL.Interface;
using DAL.Interface;
using DAL.PersistenceModel;
using MapsterMapper;

namespace BL.Service;

public class TourService(ITourRepository tourRepository, IMapper mapper, IUserContext userContext) : ITourService
{
    public async Task<TourDomain> CreateTourAsync(TourDomain tour, CancellationToken cancellationToken = default)
    {
        var tourPersistence = mapper.Map<TourPersistence>(tour);
        var createdTour = await tourRepository.CreateTourAsync(tourPersistence, userContext.UserId, cancellationToken);
        return mapper.Map<TourDomain>(createdTour);
    }

    public IEnumerable<TourDomain> GetAllTours()
    {
        var tours = tourRepository.GetAllTours(userContext.UserId);
        return mapper.Map<IEnumerable<TourDomain>>(tours);
    }

    public TourDomain? GetTourById(Guid id)
    {
        var tourPersistence = tourRepository.GetTourById(id, userContext.UserId);
        return tourPersistence is null ? null : mapper.Map<TourDomain>(tourPersistence);
    }

    public async Task<TourDomain> UpdateTourAsync(TourDomain tour, CancellationToken cancellationToken = default)
    {
        var tourPersistence = mapper.Map<TourPersistence>(tour);
        var updatedTour = await tourRepository.UpdateTourAsync(tourPersistence, userContext.UserId, cancellationToken);
        return mapper.Map<TourDomain>(updatedTour);
    }

    public Task DeleteTourAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return tourRepository.DeleteTourAsync(id, userContext.UserId, cancellationToken);
    }

    public IEnumerable<TourDomain> SearchTours(string searchText)
    {
        var dbResults = tourRepository.SearchToursAsync(searchText, userContext.UserId)
            .ToList()
            .Select(t => mapper.Map<TourDomain>(t))
            .ToList();

        if (string.IsNullOrWhiteSpace(searchText)) return dbResults;

        var allTours = tourRepository.GetAllTours(userContext.UserId)
            .Select(t => mapper.Map<TourDomain>(t))
            .ToList();

        var computedMatches = allTours.Where(t =>
            !dbResults.Any(r => r.Id == t.Id) &&
            MatchesComputedValues(t, searchText));

        return [.. dbResults, .. computedMatches];
    }

    private static bool MatchesComputedValues(TourDomain tour, string searchText)
    {
        var text = searchText.ToUpperInvariant();
        var popularity = FormatPopularity(tour.PopularityScore).ToUpperInvariant();

        return popularity.Contains(text) ||
               (tour.IsChildFriendly && "CHILD-FRIENDLY".Contains(text));
    }

    private static string FormatPopularity(int score) => score switch
    {
        >= 4 => "Very popular",
        3 => "Popular",
        2 => "Moderately popular",
        1 => "Less popular",
        _ => "Not popular"
    };
}
```

- [ ] **Step 2: Update TourLogService**

```csharp
using BL.DomainModel;
using BL.Interface;
using DAL.Interface;
using DAL.PersistenceModel;
using MapsterMapper;

namespace BL.Service;

public class TourLogService(ITourLogRepository tourLogRepository, IMapper mapper, IUserContext userContext) : ITourLogService
{
    public async Task<TourLogDomain> CreateTourLogAsync(TourLogDomain tourLog,
        CancellationToken cancellationToken = default)
    {
        var tourLogPersistence = mapper.Map<TourLogPersistence>(tourLog);
        var createdTourLogPersistence =
            await tourLogRepository.CreateTourLogAsync(tourLogPersistence, userContext.UserId, cancellationToken);
        return mapper.Map<TourLogDomain>(createdTourLogPersistence);
    }

    public IEnumerable<TourLogDomain> GetTourLogsByTourId(Guid tourId)
    {
        var tourLogPersistence = tourLogRepository.GetTourLogsByTourId(tourId, userContext.UserId);
        return mapper.Map<IEnumerable<TourLogDomain>>(tourLogPersistence);
    }

    public TourLogDomain? GetTourLogById(Guid id)
    {
        var tourLogPersistence = tourLogRepository.GetTourLogById(id, userContext.UserId);
        return tourLogPersistence is null ? null : mapper.Map<TourLogDomain>(tourLogPersistence);
    }

    public async Task<TourLogDomain> UpdateTourLogAsync(TourLogDomain tourLog,
        CancellationToken cancellationToken = default)
    {
        var tourLogPersistence = mapper.Map<TourLogPersistence>(tourLog);
        var updatedTourLogPersistence =
            await tourLogRepository.UpdateTourLogAsync(tourLogPersistence, userContext.UserId, cancellationToken);
        return mapper.Map<TourLogDomain>(updatedTourLogPersistence);
    }

    public Task DeleteTourLogAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return tourLogRepository.DeleteTourLogAsync(id, userContext.UserId, cancellationToken);
    }
}
```

- [ ] **Step 3: Update FileService**

Add `IUserContext` to constructor (used transitively via `tourService`). `FileService` itself does not call repositories directly -- `tourService` already uses `userContext.UserId`. No signature changes needed on `IFileService`.

```csharp
using System.Text.Json;
using BL.DomainModel;
using BL.Interface;

namespace BL.Service;

public class FileService(ITourService tourService, IPdfReportService pdfReportService) : IFileService
{
    public byte[] GenerateTourReport(Guid tourId)
    {
        var tour = tourService.GetTourById(tourId)
                   ?? throw new InvalidOperationException($"Tour with ID '{tourId}' not found.");
        return pdfReportService.GenerateTourReport(tour);
    }

    public byte[] GenerateSummaryReport(IEnumerable<TourDomain> tours)
    {
        return pdfReportService.GenerateSummaryReport(tours);
    }

    public TourDomain ExportTourToJson(Guid tourId)
    {
        return tourService.GetTourById(tourId)
               ?? throw new InvalidOperationException($"Tour with ID '{tourId}' not found.");
    }

    public async Task ImportTourFromJsonAsync(string json, CancellationToken cancellationToken = default)
    {
        var tour = JsonSerializer.Deserialize<TourDomain>(json);
        if (tour is not null) await tourService.CreateTourAsync(tour, cancellationToken);
    }
}
```

Note: `FileService` does not change because `tourService.GetTourById` and `tourService.CreateTourAsync` already use `IUserContext` internally. The user scoping flows through `TourService`.

- [ ] **Step 4: Build to verify**

Run: `dotnet build`
Expected: Build succeeded

- [ ] **Step 5: Commit**

```bash
git add BL/Service/
git commit -m "feat: inject IUserContext into BL services, pass userId to all repository calls"
```

---

### Task 11: Add AuthEndpoints + update controllers with [Authorize]

**Files:**
- Create: `API/Endpoints/AuthEndpoints.cs`
- Modify: `API/Controllers/TourController.cs`
- Modify: `API/Controllers/TourLogController.cs`
- Modify: `API/Endpoints/ReportEndpoints.cs`
- Modify: `API/Endpoints/RouteEndpoints.cs`

- [ ] **Step 1: Create AuthEndpoints**

```csharp
// API/Endpoints/AuthEndpoints.cs
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;

namespace API.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var auth = endpoints.MapGroup("/api/auth").WithTags("Auth");
        auth.MapPost("/register", Register);
        auth.MapPost("/login", Login);
        auth.MapPost("/logout", Logout).RequireAuthorization();
        auth.MapGet("/me", Me).RequireAuthorization();
        return endpoints;
    }

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

    private static async Task<Results<Ok<UserInfo>, UnauthorizedHttpResult>> Login(
        LoginRequest request,
        SignInManager<IdentityUser> signInManager,
        UserManager<IdentityUser> userManager)
    {
        var result = await signInManager.PasswordSignInAsync(
            request.Email, request.Password, isPersistent: true, lockoutOnFailure: false);

        if (!result.Succeeded) return TypedResults.Unauthorized();

        var user = await userManager.FindByEmailAsync(request.Email);
        return TypedResults.Ok(new UserInfo(user!.Id, user.Email!));
    }

    private static async Task<Ok> Logout(SignInManager<IdentityUser> signInManager)
    {
        await signInManager.SignOutAsync();
        return TypedResults.Ok();
    }

    private static async Task<Results<Ok<UserInfo>, UnauthorizedHttpResult>> Me(
        HttpContext httpContext,
        UserManager<IdentityUser> userManager)
    {
        var user = await userManager.GetUserAsync(httpContext.User);
        if (user is null) return TypedResults.Unauthorized();
        return TypedResults.Ok(new UserInfo(user.Id, user.Email!));
    }
}

public sealed record RegisterRequest(
    [Required] string Email,
    [Required] string Password);

public sealed record LoginRequest(
    [Required] string Email,
    [Required] string Password);

public sealed record UserInfo(string Id, string Email);
```

- [ ] **Step 2: Add [Authorize] to TourController**

Add `using Microsoft.AspNetCore.Authorization;` and `[Authorize]` attribute at class level:

```csharp
[ApiController]
[Route("api/tour")]
[Authorize]
public class TourController(ITourService tourService, IMapper mapper) : ControllerBase
```

- [ ] **Step 3: Add [Authorize] to TourLogController**

```csharp
[ApiController]
[Route("api/tourlog")]
[Authorize]
public class TourLogController(ITourLogService tourLogService, IMapper mapper) : ControllerBase
```

- [ ] **Step 4: Add RequireAuthorization to ReportEndpoints**

In `ReportEndpoints.cs`, chain `.RequireAuthorization()` on the group:

```csharp
var reports = endpoints.MapGroup("/api/reports").WithTags("Reports").RequireAuthorization();
```

- [ ] **Step 5: Add RequireAuthorization to RouteEndpoints**

```csharp
var routes = endpoints.MapGroup("/api/routes").WithTags("Routes").RequireAuthorization();
```

- [ ] **Step 6: Build to verify**

Run: `dotnet build API/API.csproj`
Expected: Build succeeded

- [ ] **Step 7: Commit**

```bash
git add API/Endpoints/AuthEndpoints.cs API/Controllers/ API/Endpoints/
git commit -m "feat: add auth endpoints (register/login/logout/me), add [Authorize] to all controllers"
```

---

### Task 12: Update Program.cs -- register Identity, IUserContext, auth middleware

**Files:**
- Modify: `API/Program.cs`

- [ ] **Step 1: Update Program.cs**

```csharp
using Autofac;
using Autofac.Extensions.DependencyInjection;
using API.Endpoints;
using API.Infrastructure;
using BL.Interface;
using BL.Module;
using DAL.Infrastructure;
using DAL.Module;
using Microsoft.AspNetCore.Identity;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((context, services, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration).ReadFrom.Services(services)
);

builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());
builder.Host.ConfigureContainer<ContainerBuilder>(containerBuilder =>
{
    containerBuilder.RegisterModule(new PostgreContextModule(builder.Configuration));
    containerBuilder.RegisterModule(new BusinessLogicModule(builder.Configuration));
    containerBuilder.RegisterModule(new OrmModule());
});

// Identity (registered on builder.Services, not Autofac)
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
    {
        options.Password.RequireDigit = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;
    })
    .AddEntityFrameworkStores<TourPlannerContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContext, UserContext>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowUI", policy =>
        policy
            .WithOrigins(
                "http://localhost:7226",
                "http://localhost",
                "http://tourplanner-ui",
                "http://tourplanner-ui:80"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
    );
});
builder.Services.AddProblemDetails();
builder.Services.AddValidation();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient("OpenRouteService").AddStandardResilienceHandler();
builder.Services.AddHealthChecks().AddCheck<PostgreSqlHealthCheck>("postgres");
var app = builder.Build();

app.UseRouting();
app.UseCors("AllowUI");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.MapControllers();
app.MapRouteEndpoints();
app.MapReportEndpoints();
app.MapAuthEndpoints();
app.MapHealthChecks("/health");
app.MapOpenApi("/openapi/{documentName}.json");
app.Run();
```

Key changes: Identity registration, cookie config (401 instead of redirect), `AddHttpContextAccessor`, `AddScoped<IUserContext, UserContext>`, `app.UseAuthentication()` before `UseAuthorization()`, `MapAuthEndpoints()`.

- [ ] **Step 2: Build to verify**

Run: `dotnet build API/API.csproj`
Expected: Build succeeded

- [ ] **Step 3: Commit**

```bash
git add API/Program.cs
git commit -m "feat: register Identity, IUserContext, cookie auth middleware in Program.cs"
```

---

### Task 13: Frontend auth core -- AuthApiService, AuthState, guard, interceptor

**Files:**
- Create: `src/app/features/auth/models/auth.model.ts`
- Create: `src/app/core/auth/auth-api.service.ts`
- Create: `src/app/core/auth/auth-state.service.ts`
- Create: `src/app/core/auth/auth.guard.ts`
- Create: `src/app/core/auth/auth.interceptor.ts`

- [ ] **Step 1: Create auth models**

```typescript
// src/app/features/auth/models/auth.model.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
}
```

- [ ] **Step 2: Create AuthApiService**

```typescript
// src/app/core/auth/auth-api.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import type { LoginRequest, RegisterRequest, UserInfo } from '../../features/auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  register(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(this.url('api/auth/register'), request);
  }

  login(request: LoginRequest): Observable<UserInfo> {
    return this.http.post<UserInfo>(this.url('api/auth/login'), request);
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.url('api/auth/logout'), {});
  }

  me(): Observable<UserInfo> {
    return this.http.get<UserInfo>(this.url('api/auth/me'));
  }

  private url(path: string): string {
    return new URL(path, this.baseUrl).toString();
  }
}
```

- [ ] **Step 3: Create AuthState**

```typescript
// src/app/core/auth/auth-state.service.ts
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import type { UserInfo } from '../../features/auth/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly authApi = inject(AuthApiService);

  private readonly user = signal<UserInfo | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly currentUser = computed(() => this.user());

  async checkSession(): Promise<void> {
    try {
      const user = await firstValueFrom(this.authApi.me());
      this.user.set(user);
    } catch {
      this.user.set(null);
    }
  }

  setUser(user: UserInfo): void {
    this.user.set(user);
  }

  clear(): void {
    this.user.set(null);
  }
}
```

- [ ] **Step 4: Create auth guard**

```typescript
// src/app/core/auth/auth.guard.ts
import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthState } from './auth-state.service';

export const authGuard: CanActivateFn = async () => {
  const authState = inject(AuthState);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    await authState.checkSession();
  }

  if (authState.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

- [ ] **Step 5: Create auth interceptor**

```typescript
// src/app/core/auth/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthState } from './auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthState);

  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('/api/auth/')) {
        authState.clear();
        // Full reload to reset all root-scoped ViewModels (TourViewModel, etc.)
        window.location.href = '/login';
      }
      return throwError(() => error);
    }),
  );
};
```

- [ ] **Step 6: Build to verify**

Run: `npx ng build`
Expected: Build succeeded

- [ ] **Step 7: Commit**

```bash
git add src/app/features/auth/models/ src/app/core/auth/
git commit -m "feat: add frontend auth core (AuthApiService, AuthState, guard, interceptor)"
```

---

### Task 14: Frontend auth pages -- login + register

**Files:**
- Create: `src/app/features/auth/viewmodels/auth.viewmodel.ts`
- Create: `src/app/features/auth/pages/login-page.component.ts`
- Create: `src/app/features/auth/pages/login-page.component.html`
- Create: `src/app/features/auth/pages/login-page.component.css`
- Create: `src/app/features/auth/pages/register-page.component.ts`
- Create: `src/app/features/auth/pages/register-page.component.html`
- Create: `src/app/features/auth/pages/register-page.component.css`

- [ ] **Step 1: Create AuthViewModel**

```typescript
// src/app/features/auth/viewmodels/auth.viewmodel.ts
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { AuthState } from '../../../core/auth/auth-state.service';
import type { LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthViewModel {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async login(request: LoginRequest): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const user = await firstValueFrom(this.authApi.login(request));
      this.authState.setUser(user);
      await this.router.navigate(['/tours']);
    } catch {
      this.errorMessage.set('Invalid email or password.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async register(request: RegisterRequest): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.authApi.register(request));
      await this.login({ email: request.email, password: request.password });
    } catch {
      this.errorMessage.set('Registration failed. Email may already be in use.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

- [ ] **Step 2: Create login page component**

```typescript
// src/app/features/auth/pages/login-page.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthViewModel } from '../viewmodels/auth.viewmodel';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  protected readonly vm = inject(AuthViewModel);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    void this.vm.login(this.form.getRawValue());
  }
}
```

- [ ] **Step 3: Create login page HTML**

```html
<!-- src/app/features/auth/pages/login-page.component.html -->
<section class="auth-page">
  <h1>Login</h1>

  @if (vm.errorMessage()) {
    <p class="auth-page__error">{{ vm.errorMessage() }}</p>
  }

  <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()">
    <label class="auth-form__field">
      <span>Email</span>
      <input type="email" formControlName="email" />
    </label>

    <label class="auth-form__field">
      <span>Password</span>
      <input type="password" formControlName="password" />
    </label>

    <button type="submit" [disabled]="form.invalid || vm.isLoading()">
      {{ vm.isLoading() ? 'Logging in...' : 'Login' }}
    </button>
  </form>

  <p class="auth-page__link">
    No account? <a routerLink="/register">Register here</a>
  </p>
</section>
```

- [ ] **Step 4: Create login page CSS**

```css
/* src/app/features/auth/pages/login-page.component.css */
.auth-page {
  max-width: 400px;
  margin: 4rem auto;
  padding: 2rem;
}

.auth-page__error {
  color: var(--color-error, #dc2626);
  margin-bottom: 1rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.auth-page__link {
  margin-top: 1rem;
  text-align: center;
}
```

- [ ] **Step 5: Create register page component**

```typescript
// src/app/features/auth/pages/register-page.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthViewModel } from '../viewmodels/auth.viewmodel';

@Component({
  selector: 'app-register-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css',
})
export class RegisterPageComponent {
  protected readonly vm = inject(AuthViewModel);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    void this.vm.register(this.form.getRawValue());
  }
}
```

- [ ] **Step 6: Create register page HTML**

```html
<!-- src/app/features/auth/pages/register-page.component.html -->
<section class="auth-page">
  <h1>Register</h1>

  @if (vm.errorMessage()) {
    <p class="auth-page__error">{{ vm.errorMessage() }}</p>
  }

  <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()">
    <label class="auth-form__field">
      <span>Email</span>
      <input type="email" formControlName="email" />
    </label>

    <label class="auth-form__field">
      <span>Password (min. 6 characters)</span>
      <input type="password" formControlName="password" />
    </label>

    <button type="submit" [disabled]="form.invalid || vm.isLoading()">
      {{ vm.isLoading() ? 'Registering...' : 'Register' }}
    </button>
  </form>

  <p class="auth-page__link">
    Already have an account? <a routerLink="/login">Login here</a>
  </p>
</section>
```

- [ ] **Step 7: Create register page CSS (same as login)**

```css
/* src/app/features/auth/pages/register-page.component.css */
.auth-page {
  max-width: 400px;
  margin: 4rem auto;
  padding: 2rem;
}

.auth-page__error {
  color: var(--color-error, #dc2626);
  margin-bottom: 1rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.auth-page__link {
  margin-top: 1rem;
  text-align: center;
}
```

- [ ] **Step 8: Build to verify**

Run: `npx ng build`
Expected: Build succeeded

- [ ] **Step 9: Commit**

```bash
git add src/app/features/auth/
git commit -m "feat: add login and register pages with AuthViewModel"
```

---

### Task 15: Wire up routes, interceptor, navbar, logout state reset

**Files:**
- Modify: `src/app/app.config.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/layout/navbar/app-navbar.component.ts`
- Modify: `src/app/layout/navbar/app-navbar.component.html`

- [ ] **Step 1: Update app.config.ts -- add interceptor**

```typescript
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from './core/config/api-base-url.token';
import { authInterceptor } from './core/auth/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideRouter(routes),
    { provide: API_BASE_URL, useValue: '/' },
  ]
};
```

- [ ] **Step 2: Update app.routes.ts -- add auth routes + guard**

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register-page.component').then(
        (m) => m.RegisterPageComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tours',
  },
  {
    path: 'tours',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tours/pages/tours-page.component').then(
        (module) => module.ToursPageComponent,
      ),
  },
  {
    path: 'tour-logs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tour-logs/pages/tour-logs-page.component').then(
        (module) => module.TourLogsPageComponent,
      ),
  },
  {
    path: 'tour-logs/:tourId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tour-logs/pages/tour-logs-page.component').then(
        (module) => module.TourLogsPageComponent,
      ),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/pages/reports-page.component').then(
        (module) => module.ReportsPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'tours',
  },
];
```

- [ ] **Step 3: Update navbar to show user + logout**

```typescript
// src/app/layout/navbar/app-navbar.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthState } from '../../core/auth/auth-state.service';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-navbar.component.html',
  styleUrl: './app-navbar.component.css',
})
export class AppNavbarComponent {
  protected readonly authState = inject(AuthState);
  private readonly authApi = inject(AuthApiService);

  protected async logout(): Promise<void> {
    await firstValueFrom(this.authApi.logout());
    this.authState.clear();
    window.location.href = '/login';
  }
}
```

- [ ] **Step 4: Update navbar HTML**

```html
<!-- src/app/layout/navbar/app-navbar.component.html -->
<header class="navbar">
  <div class="navbar__brand">
    <span class="navbar__course">SWEN2</span>
    <span class="navbar__title">TourPlanner Angular</span>
  </div>

  @if (authState.isAuthenticated()) {
    <nav class="navbar__links" aria-label="Primary">
      <a routerLink="/tours" routerLinkActive="navbar__link--active" class="navbar__link">Tours</a>
      <a routerLink="/tour-logs" routerLinkActive="navbar__link--active" class="navbar__link">Tour Logs</a>
      <a routerLink="/reports" routerLinkActive="navbar__link--active" class="navbar__link">Reports</a>
    </nav>

    <div class="navbar__user">
      <span>{{ authState.currentUser()?.email }}</span>
      <button type="button" class="navbar__logout" (click)="logout()">Logout</button>
    </div>
  }
</header>
```

- [ ] **Step 5: Build Angular to verify**

Run: `npx ng build`
Expected: Build succeeded

- [ ] **Step 6: Run Angular tests**

Run: `npx ng test --watch=false`
Expected: All tests pass (some may need minor mock updates for AuthState injection)

- [ ] **Step 7: Commit**

```bash
git add src/app/app.config.ts src/app/app.routes.ts src/app/layout/navbar/
git commit -m "feat: wire auth interceptor, route guard, navbar user/logout"
```

---

### Task 16: Create EF migration

**Files:**
- Generated migration files in `DAL/Migrations/`

- [ ] **Step 1: Drop existing database (dev only)**

Run: `dotnet ef database drop --project API --force`

This is necessary because the schema changes significantly (IdentityDbContext, UserId columns).

- [ ] **Step 2: Remove existing migrations if any**

Check `DAL/Migrations/` -- if migrations exist, delete the folder contents.

- [ ] **Step 3: Create fresh migration**

Run: `dotnet ef migrations add AddIdentityAndUserOwnership --project DAL --startup-project API`
Expected: Migration files created

- [ ] **Step 4: Apply migration**

Run: `dotnet ef database update --project DAL --startup-project API`
Expected: Database updated

- [ ] **Step 5: Commit**

```bash
git add DAL/Migrations/
git commit -m "feat: add EF migration for Identity tables and UserId columns"
```
