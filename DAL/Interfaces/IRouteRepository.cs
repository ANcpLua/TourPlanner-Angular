namespace DAL.Interfaces;

public interface IRouteRepository
{
    Task<(double Distance, double Duration)> ResolveRouteAsync(
        (double Latitude, double Longitude) from,
        (double Latitude, double Longitude) destination,
        string transportType,
        CancellationToken cancellationToken = default
    );
}
