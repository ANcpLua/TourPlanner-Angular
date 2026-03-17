using System.Globalization;

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

    public string FormattedPopularity => PopularityScore switch
    {
        >= 4 => "Very popular",
        3 => "Popular",
        2 => "Moderately popular",
        1 => "Less popular",
        _ => "Not popular"
    };

    public bool IsChildFriendly =>
        Logs.Count > 0 &&
        Logs.Average(static l => l.Difficulty) <= 2.0 &&
        Logs.Average(static l => l.TotalTime) <= 120 &&
        Logs.Average(static l => l.TotalDistance) <= 10;

    public double? AverageRating =>
        Logs.Count > 0 ? Logs.Average(static l => l.Rating) : null;

    public string SearchableText => string.Join('\n',
    [
        Name,
        Description,
        From,
        To,
        TransportType,
        FormattedPopularity,
        PopularityScore.ToString(CultureInfo.InvariantCulture),
        IsChildFriendly ? "child-friendly" : string.Empty,
        AverageRating?.ToString("F1", CultureInfo.InvariantCulture) ?? string.Empty,
        .. Logs.Select(static l => l.Comment ?? string.Empty)
    ]);
}
