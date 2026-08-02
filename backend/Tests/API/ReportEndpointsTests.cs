using API.Endpoints;
using BL.DomainModel;
using BL.Interfaces;
using Contracts.Reports;
using Contracts.Tours;
using MapsterMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

namespace Tests.API;

[TestFixture]
public class ReportEndpointsTests
{
    [SetUp]
    public void Setup()
    {
        _mockTourService = new Mock<ITourService>();
        _mockPdfReportService = new Mock<IPdfReportService>();
        _mockMapper = new Mock<IMapper>();
    }

    private Mock<ITourService> _mockTourService = null!;
    private Mock<IPdfReportService> _mockPdfReportService = null!;
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
        _mockPdfReportService.Setup(s => s.GenerateSummaryReport(tours)).Returns(pdfBytes);

        var result = ReportEndpoints.GetSummaryReport(_mockPdfReportService.Object, _mockTourService.Object);

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
        var tour = TourTestData.SampleTourDomain();
        byte[] pdfBytes = [4, 5, 6];
        _mockTourService.Setup(s => s.GetTourById(tourId)).Returns(tour);
        _mockPdfReportService.Setup(s => s.GenerateTourReport(tour)).Returns(pdfBytes);

        var result = ReportEndpoints.GetTourReport(tourId, _mockTourService.Object, _mockPdfReportService.Object);

        Assert.That(result.Result, Is.TypeOf<FileContentHttpResult>());
    }

    [Test]
    public void GetTourReport_InvalidTourId_ReturnsNotFound()
    {
        _mockTourService.Setup(static s => s.GetTourById(TestConstants.NonexistentGuid)).Returns((TourDomain?)null);

        var result = ReportEndpoints.GetTourReport(
            TestConstants.NonexistentGuid,
            _mockTourService.Object,
            _mockPdfReportService.Object);

        Assert.That(result.Result, Is.TypeOf<NotFound>());
    }

    [Test]
    public void ExportTourToXml_HappyPath_ReturnsXmlContent()
    {
        var tourId = Guid.NewGuid();
        var tourDomain = TourTestData.SampleTourDomain();
        _mockTourService.Setup(s => s.GetTourById(tourId)).Returns(tourDomain);

        var result = ReportEndpoints.ExportTourToXml(tourId, _mockTourService.Object);

        Assert.That(result.Result, Is.TypeOf<ContentHttpResult>());
    }

    [Test]
    public void ExportTourToXml_InvalidTourId_ReturnsNotFound()
    {
        _mockTourService.Setup(static s => s.GetTourById(TestConstants.NonexistentGuid)).Returns((TourDomain?)null);

        var result = ReportEndpoints.ExportTourToXml(TestConstants.NonexistentGuid, _mockTourService.Object);

        Assert.That(result.Result, Is.TypeOf<NotFound>());
    }

    [Test]
    public async Task ImportTourFromXmlAsync_HappyPath_ReturnsCreatedResult()
    {
        var request = new ImportTourRequest { Xml = TourTestData.SampleTourXml() };
        var createdTour = TourTestData.SampleTourDomain();
        var tourDto = TourTestData.SampleTourDto();
        _mockTourService
            .Setup(s => s.CreateTourAsync(It.IsAny<TourDomain>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdTour);
        _mockMapper.Setup(m => m.Map<TourDto>(createdTour)).Returns(tourDto);

        var result = await ReportEndpoints.ImportTourFromXmlAsync(
            request,
            _mockTourService.Object,
            _mockMapper.Object,
            CancellationToken.None);

        Assert.That(result.Result, Is.TypeOf<Created<TourDto>>());
    }

    [Test]
    public async Task ImportTourFromXmlAsync_InvalidXml_ReturnsValidationProblem()
    {
        var request = new ImportTourRequest { Xml = "not xml" };

        var result = await ReportEndpoints.ImportTourFromXmlAsync(
            request,
            _mockTourService.Object,
            _mockMapper.Object,
            CancellationToken.None);

        Assert.That(result.Result, Is.TypeOf<ValidationProblem>());
    }

}
