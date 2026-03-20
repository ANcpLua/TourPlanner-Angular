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
        var popularity = tour.FormattedPopularity.ToUpperInvariant();
        return popularity.Contains(text) ||
               (tour.IsChildFriendly && "CHILD-FRIENDLY".Contains(text));
    }

}
