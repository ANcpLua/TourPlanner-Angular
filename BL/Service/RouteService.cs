using BL.Interfaces;
using DAL.Interfaces;

namespace BL.Service;

public class RouteService(IRouteRepository routeRepository) : IRouteService
{
    public Task<(double Distance, double Duration)> ResolveRouteAsync(
        (double Latitude, double Longitude) from,
        (double Latitude, double Longitude) destination,
        string transportType,
        CancellationToken cancellationToken = default
    )
    {
        return routeRepository.ResolveRouteAsync(from, destination, transportType, cancellationToken);
    }
}
