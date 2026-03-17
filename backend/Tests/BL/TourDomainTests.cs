using BL.DomainModel;

namespace Tests.BL;

[TestFixture]
public class TourDomainTests
{
    private static TourDomain CreateTour(params TourLogDomain[] logs) =>
        new()
        {
            Name = "Test",
            Description = "Desc",
            From = "A",
            To = "B",
            TransportType = "Car",
            Logs = [..logs]
        };

    private static TourLogDomain CreateLog(
        double difficulty = 1.0,
        double totalDistance = 5.0,
        double totalTime = 30.0,
        double rating = 5.0) =>
        new()
        {
            DateTime = TimeProvider.System.GetUtcNow().UtcDateTime,
            Difficulty = difficulty,
            TotalDistance = totalDistance,
            TotalTime = totalTime,
            Rating = rating
        };

    [Test]
    public void PopularityScore_ReturnsLogCount()
    {
        var tour = CreateTour(CreateLog(), CreateLog(), CreateLog());
        Assert.That(tour.PopularityScore, Is.EqualTo(3));
    }

    [Test]
    public void PopularityScore_NoLogs_ReturnsZero()
    {
        var tour = CreateTour();
        Assert.That(tour.PopularityScore, Is.EqualTo(0));
    }

    [Test]
    public void FormattedPopularity_NoLogs_ReturnsNotPopular()
    {
        var tour = CreateTour();
        Assert.That(tour.FormattedPopularity, Is.EqualTo("Not popular"));
    }

    [Test]
    public void FormattedPopularity_OneLog_ReturnsLessPopular()
    {
        var tour = CreateTour(CreateLog());
        Assert.That(tour.FormattedPopularity, Is.EqualTo("Less popular"));
    }

    [Test]
    public void FormattedPopularity_TwoLogs_ReturnsModeratelyPopular()
    {
        var tour = CreateTour(CreateLog(), CreateLog());
        Assert.That(tour.FormattedPopularity, Is.EqualTo("Moderately popular"));
    }

    [Test]
    public void FormattedPopularity_ThreeLogs_ReturnsPopular()
    {
        var tour = CreateTour(CreateLog(), CreateLog(), CreateLog());
        Assert.That(tour.FormattedPopularity, Is.EqualTo("Popular"));
    }

    [Test]
    public void FormattedPopularity_FourOrMoreLogs_ReturnsVeryPopular()
    {
        var tour = CreateTour(CreateLog(), CreateLog(), CreateLog(), CreateLog());
        Assert.That(tour.FormattedPopularity, Is.EqualTo("Very popular"));
    }

    [Test]
    public void IsChildFriendly_NoLogs_ReturnsFalse()
    {
        var tour = CreateTour();
        Assert.That(tour.IsChildFriendly, Is.False);
    }

    [Test]
    public void IsChildFriendly_EasyShortFast_ReturnsTrue()
    {
        var tour = CreateTour(CreateLog(difficulty: 1.0), CreateLog(difficulty: 2.0));
        Assert.That(tour.IsChildFriendly, Is.True);
    }

    [Test]
    public void IsChildFriendly_HighDifficulty_ReturnsFalse()
    {
        var tour = CreateTour(CreateLog(difficulty: 3.0));
        Assert.That(tour.IsChildFriendly, Is.False);
    }

    [Test]
    public void IsChildFriendly_LongAverageDistance_ReturnsFalse()
    {
        var tour = CreateTour(CreateLog(totalDistance: 25));
        Assert.That(tour.IsChildFriendly, Is.False);
    }

    [Test]
    public void IsChildFriendly_LongAverageTime_ReturnsFalse()
    {
        var tour = CreateTour(CreateLog(totalTime: 200));
        Assert.That(tour.IsChildFriendly, Is.False);
    }

    [Test]
    public void AverageRating_NoLogs_ReturnsNull()
    {
        var tour = CreateTour();
        Assert.That(tour.AverageRating, Is.Null);
    }

    [Test]
    public void AverageRating_WithLogs_ReturnsAverage()
    {
        var tour = CreateTour(CreateLog(rating: 4.0), CreateLog(rating: 2.0));
        Assert.That(tour.AverageRating, Is.EqualTo(3.0));
    }
}
