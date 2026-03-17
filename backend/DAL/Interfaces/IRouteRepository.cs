using Contracts.Routes;

namespace DAL.Interfaces;

public interface IRouteRepository
{
    Task<ResolvedRoute> ResolveRouteAsync(
        (double Latitude, double Longitude) from,
        (double Latitude, double Longitude) destination,
        string transportType,
        CancellationToken cancellationToken = default
    );
}
