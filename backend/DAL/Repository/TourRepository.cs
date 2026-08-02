using DAL.Infrastructure;
using DAL.Interfaces;
using DAL.PersistenceModel;
using Microsoft.EntityFrameworkCore;

namespace DAL.Repository;

public class TourRepository(TourPlannerContext dbContext) : ITourRepository
{
    public async Task<TourPersistence> CreateTourAsync(TourPersistence tour, string userId,
        CancellationToken cancellationToken = default)
    {
        tour.UserId = userId;
        foreach (var tourLog in tour.TourLogPersistence)
            tourLog.UserId = userId;

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
            .Include(t => t.TourLogPersistence)
            .FirstOrDefault(t => t.Id == id && t.UserId == userId);
    }

    public async Task<TourPersistence> UpdateTourAsync(TourPersistence tour, string userId,
        CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.Set<TourPersistence>()
            .FirstOrDefaultAsync(t => t.Id == tour.Id && t.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Tour not found or access denied.");
        dbContext.Entry(existing).CurrentValues.SetValues(tour);
        existing.UserId = userId;
        await dbContext.SaveChangesAsync(cancellationToken);
        return existing;
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
}
