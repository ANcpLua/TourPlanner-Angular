using BL.Interfaces;
using Contracts.Routes;
using DAL.Interfaces;

namespace BL.Service;

public class RouteService(IRouteRepository routeRepository) : IRouteService
{
    public Task<ResolvedRoute> ResolveRouteAsync(
        (double Latitude, double Longitude) from,
        (double Latitude, double Longitude) destination,
        string transportType,
        CancellationToken cancellationToken = default
    )
    {
        return routeRepository.ResolveRouteAsync(from, destination, transportType, cancellationToken);
    }
}
