using BL.DomainModel;
using BL.Interfaces;
using BL.Service;

namespace Tests.BL;

[TestFixture]
public class FileServiceTests
{
    [SetUp]
    public void Setup()
    {
        _mockTourService = new Mock<ITourService>();
        _mockPdfReportService = new Mock<IPdfReportService>();
        _fileService = new FileService(_mockTourService.Object, _mockPdfReportService.Object);
    }

    private Mock<ITourService> _mockTourService = null!;
    private Mock<IPdfReportService> _mockPdfReportService = null!;
    private FileService _fileService = null!;

    [Test]
    public void GenerateTourReport_ValidTourId_ReturnsPdfBytes()
    {
        var tourId = TestConstants.TestGuid;
        var tour = TourTestData.SampleTourDomain();
        byte[] expectedPdfBytes =
        [
            1, 2, 3, 4, 5
        ];

        _mockTourService.Setup(s => s.GetTourById(tourId)).Returns(tour);
        _mockPdfReportService.Setup(s => s.GenerateTourReport(tour)).Returns(expectedPdfBytes);

        var result = _fileService.GenerateTourReport(tourId);

        Assert.That(result, Is.EqualTo(expectedPdfBytes));
        _mockTourService.Verify(s => s.GetTourById(tourId), Times.Once);
        _mockPdfReportService.Verify(s => s.GenerateTourReport(tour), Times.Once);
    }

    [Test]
    public void GenerateSummaryReport_ValidTours_ReturnsPdfBytes()
    {
        var tours = TourTestData.SampleTourDomainList();
        byte[] expectedPdfBytes =
        [
            1, 2, 3, 4, 5
        ];

        _mockPdfReportService.Setup(s => s.GenerateSummaryReport(tours)).Returns(expectedPdfBytes);

        var result = _fileService.GenerateSummaryReport(tours);

        Assert.That(result, Is.EqualTo(expectedPdfBytes));
        _mockPdfReportService.Verify(s => s.GenerateSummaryReport(tours), Times.Once);
    }

    [Test]
    public void ExportTourToJson_ValidTourId_ReturnsTourDomain()
    {
        var tourId = TestConstants.TestGuid;
        var expectedTour = TourTestData.SampleTourDomain();

        _mockTourService.Setup(s => s.GetTourById(tourId)).Returns(expectedTour);

        var result = _fileService.ExportTourToJson(tourId);

        Assert.That(result, Is.EqualTo(expectedTour));
        _mockTourService.Verify(s => s.GetTourById(tourId), Times.Once);
    }

    [Test]
    public void GenerateSummaryReport_LargeTourList_HandlesLargeDataSet()
    {
        List<TourDomain> largeTourList = [.. Enumerable
            .Range(0, 1000)
            .Select(_ => TourTestData.SampleTourDomain())];
        var expectedPdfBytes = new byte[1024 * 1024];

        _mockPdfReportService
            .Setup(s => s.GenerateSummaryReport(largeTourList))
            .Returns(expectedPdfBytes);

        var result = _fileService.GenerateSummaryReport(largeTourList);

        Assert.That(result, Is.EqualTo(expectedPdfBytes));
        _mockPdfReportService.Verify(s => s.GenerateSummaryReport(largeTourList), Times.Once);
    }

    [Test]
    public void ExportTourToJsonAsync_TourWithLargeLogs_HandlesLargeDataSet()
    {
        var tourId = TestConstants.TestGuid;
        var tourWithLargeLogs = TourTestData.SampleTourDomain();
        tourWithLargeLogs.Logs = [.. Enumerable
            .Range(0, 10000)
            .Select(_ => TourLogTestData.SampleTourLogDomain())];

        _mockTourService.Setup(s => s.GetTourById(tourId)).Returns(tourWithLargeLogs);

        var result = _fileService.ExportTourToJson(tourId);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(result, Is.Not.Null.And.EqualTo(tourWithLargeLogs));
            Assert.That(result?.Logs, Has.Count.EqualTo(10000));
        }
        _mockTourService.Verify(s => s.GetTourById(tourId), Times.Once);
    }

    [Test]
    public void ExportTourToJson_InvalidTourId_ReturnsNull()
    {
        var invalidTourId = TestConstants.NonexistentGuid;
        _mockTourService.Setup(s => s.GetTourById(invalidTourId)).Returns((TourDomain?)null);

        var result = _fileService.ExportTourToJson(invalidTourId);

        Assert.That(result, Is.Null);
        _mockTourService.Verify(s => s.GetTourById(invalidTourId), Times.Once);
    }

    [Test]
    public void GenerateTourReport_InvalidTourId_ReturnsNull()
    {
        var invalidTourId = TestConstants.NonexistentGuid;
        _mockTourService.Setup(s => s.GetTourById(invalidTourId)).Returns((TourDomain?)null);

        var result = _fileService.GenerateTourReport(invalidTourId);

        Assert.That(result, Is.Null);
        _mockTourService.Verify(s => s.GetTourById(invalidTourId), Times.Once);
    }

    [Test]
    public async Task ImportTourFromJsonAsync_ValidJson_CreatesTour()
    {
        var expectedTour = TourTestData.SampleTourDomain();
        var json = TourTestData.SampleTourDomainJson();

        _mockTourService
            .Setup(s => s.CreateTourAsync(It.IsAny<TourDomain>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedTour);

        await _fileService.ImportTourFromJsonAsync(json);

        _mockTourService.Verify(
            s => s.CreateTourAsync(It.Is<TourDomain>(t => t.Id == expectedTour.Id), It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Test]
    public async Task ImportTourFromJsonAsync_InvalidJson_ReturnsFalse()
    {
        const string invalidJson = "{invalid json}";

        var result = await _fileService.ImportTourFromJsonAsync(invalidJson);

        Assert.That(result, Is.False);
        _mockTourService.Verify(
            static s => s.CreateTourAsync(It.IsAny<TourDomain>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}