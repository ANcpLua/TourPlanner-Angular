using Contracts.Routes;

namespace BL.Interfaces;

public interface IRouteService
{
    Task<ResolvedRoute> ResolveRouteAsync(
        (double Latitude, double Longitude) from,
        (double Latitude, double Longitude) destination,
        string transportType,
        CancellationToken cancellationToken = default
    );
}
