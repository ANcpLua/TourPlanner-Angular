using System.Text;
using API.Endpoints;
using BL.DomainModel;
using BL.Interfaces;
using Contracts.Tours;
using MapsterMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace Tests.API;

[TestFixture]
public class ReportEndpointsTests
{
    [SetUp]
    public void Setup()
    {
        _mockFileService = new Mock<IFileService>();
        _mockTourService = new Mock<ITourService>();
        _mockMapper = new Mock<IMapper>();
    }

    private Mock<IFileService> _mockFileService = null!;
    private Mock<ITourService> _mockTourService = null!;
    private Mock<IMapper> _mockMapper = null!;

    [Test]
    public void MapReportEndpoints_RegistersEndpoints()
    {
        var builder = WebApplication.CreateBuilder();
        var app = builder.Build();
        var result = app.MapReportEndpoints();

        Assert.That(result, Is.Not.Null);
        var dataSource = app as IEndpointRouteBuilder;
        Assert.That(dataSource.DataSources, Is.Not.Empty);
    }

    [Test]
    public void GetSummaryReport_HappyPath_ReturnsPdfFile()
    {
        var tours = TourTestData.SampleTourDomainList();
        byte[] pdfBytes =
        [
            1, 2, 3
        ];
        _mockTourService.Setup(s => s.GetAllTours()).Returns(tours);
        _mockFileService.Setup(s => s.GenerateSummaryReport(tours)).Returns(pdfBytes);

        var result = ReportEndpoints.GetSummaryReport(_mockFileService.Object, _mockTourService.Object);

        Assert.That(result, Is.TypeOf<FileContentHttpResult>());
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.FileContents.ToArray(), Is.EqualTo(pdfBytes));
            Assert.That(result.ContentType, Is.EqualTo("application/pdf"));
            Assert.That(result.FileDownloadName, Is.EqualTo("SummaryReport.pdf"));
        }
    }

    [Test]
    public void GetTourReport_HappyPath_ReturnsPdfFile()
    {
        var tourId = TestConstants.TestGuid;
        byte[] pdfBytes = [4, 5, 6];
        _mockFileService.Setup(s => s.GenerateTourReport(tourId)).Returns(pdfBytes);

        var result = ReportEndpoints.GetTourReport(tourId, _mockFileService.Object);

        Assert.That(result.Result, Is.TypeOf<FileContentHttpResult>());
    }

    [Test]
    public void GetTourReport_InvalidTourId_ReturnsNotFound()
    {
        _mockFileService.Setup(static s => s.GenerateTourReport(TestConstants.NonexistentGuid)).Returns((byte[]?)null);

        var result = ReportEndpoints.GetTourReport(TestConstants.NonexistentGuid, _mockFileService.Object);

        Assert.That(result.Result, Is.TypeOf<NotFound>());
    }

    [Test]
    public void ExportTourToJson_HappyPath_ReturnsJsonResult()
    {
        var tourId = Guid.NewGuid();
        var tourDomain = TourTestData.SampleTourDomain();
        var tourDto = TourTestData.SampleTourDto();
        _mockFileService.Setup(s => s.ExportTourToJson(tourId)).Returns(tourDomain);
        _mockMapper.Setup(m => m.Map<TourDto>(tourDomain)).Returns(tourDto);

        var result = ReportEndpoints.ExportTourToJson(tourId, _mockFileService.Object, _mockMapper.Object);

        Assert.That(result.Result, Is.TypeOf<JsonHttpResult<TourDto>>());
    }

    [Test]
    public void ExportTourToJson_InvalidTourId_ReturnsNotFound()
    {
        _mockFileService.Setup(static s => s.ExportTourToJson(TestConstants.NonexistentGuid)).Returns((TourDomain?)null);

        var result = ReportEndpoints.ExportTourToJson(TestConstants.NonexistentGuid, _mockFileService.Object, _mockMapper.Object);

        Assert.That(result.Result, Is.TypeOf<NotFound>());
    }

    [Test]
    public async Task ImportTourFromJsonAsync_HappyPath_ReturnsOkResult()
    {
        var json = TourTestData.SampleTourJson();
        var request = CreateJsonRequest(json);
        _mockFileService
            .Setup(s => s.ImportTourFromJsonAsync(json, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var result = await ReportEndpoints.ImportTourFromJsonAsync(request, _mockFileService.Object, CancellationToken.None);

        Assert.That(result.Result, Is.TypeOf<Ok<string>>());
    }

    [Test]
    public async Task ImportTourFromJsonAsync_InvalidJson_ReturnsBadRequest()
    {
        const string invalidJson = "not json";
        var request = CreateJsonRequest(invalidJson);
        _mockFileService
            .Setup(static s => s.ImportTourFromJsonAsync(invalidJson, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await ReportEndpoints.ImportTourFromJsonAsync(request, _mockFileService.Object, CancellationToken.None);

        Assert.That(result.Result, Is.TypeOf<BadRequest<string>>());
    }

    private static HttpRequest CreateJsonRequest(string body)
    {
        var context = new DefaultHttpContext();
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(body));
        context.Request.ContentType = "application/json";
        return context.Request;
    }

}
