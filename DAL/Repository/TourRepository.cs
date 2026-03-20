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
        if (string.IsNullOrWhiteSpace(searchText))
            return dbContext.ToursPersistence.Where(t => t.UserId == userId);

        return dbContext
            .ToursPersistence.Include(t => t.TourLogPersistence)
            .Where(t =>
                t.UserId == userId &&
                (t.Name.Contains(searchText) ||
                 t.Description.Contains(searchText) ||
                 t.From.Contains(searchText) ||
                 t.To.Contains(searchText) ||
                 t.TourLogPersistence.Any(tl => tl.Comment.Contains(searchText)))
            );
    }
}
