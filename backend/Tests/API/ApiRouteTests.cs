using API.Endpoints;

namespace Tests.API;

[TestFixture]
public class ApiRouteTests
{
    private static readonly Guid SampleId = TestConstants.TestGuid;

    [Test]
    public void Tour_ById_ReturnsExpectedPath()
    {
        Assert.That(ApiRoute.Tour.ById(SampleId), Is.EqualTo($"/api/tour/{SampleId}"));
    }

    [Test]
    public void Tour_SearchByText_ReturnsExpectedPath()
    {
        Assert.That(ApiRoute.Tour.SearchByText("alpine"), Is.EqualTo("/api/tour/search/alpine"));
    }

    [Test]
    public void TourLog_ById_ReturnsExpectedPath()
    {
        Assert.That(ApiRoute.TourLog.ById(SampleId), Is.EqualTo($"/api/tourlog/{SampleId}"));
    }

    [Test]
    public void TourLog_ByTourId_ReturnsExpectedPath()
    {
        Assert.That(ApiRoute.TourLog.ByTourId(SampleId), Is.EqualTo($"/api/tourlog/bytour/{SampleId}"));
    }

    [Test]
    public void Reports_TourById_ReturnsExpectedPath()
    {
        Assert.That(ApiRoute.Reports.TourById(SampleId), Is.EqualTo($"/api/reports/tour/{SampleId}"));
    }

    [Test]
    public void Reports_ExportById_ReturnsExpectedPath()
    {
        Assert.That(ApiRoute.Reports.ExportById(SampleId), Is.EqualTo($"/api/reports/export/{SampleId}"));
    }
}
