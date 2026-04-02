using API.Controllers;
using BL.DomainModel;
using BL.Interfaces;
using Contracts.Tours;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace Tests.API;

[TestFixture]
public class TourControllerTests
{
    [SetUp]
    public void Setup()
    {
        _mockTourService = new Mock<ITourService>();
        _mockMapper = new Mock<IMapper>();
        _controller = new TourController(_mockTourService.Object, _mockMapper.Object);
    }

    private Mock<ITourService> _mockTourService = null!;
    private Mock<IMapper> _mockMapper = null!;
    private TourController _controller = null!;

    [Test]
    public async Task CreateTourAsync_HappyPath_ReturnsCreatedTour()
    {
        var tourDto = TourTestData.SampleTourDto();
        var tourDomain = TourTestData.SampleTourDomain();
        _mockMapper.Setup(m => m.Map<TourDomain>(tourDto)).Returns(tourDomain);
        _mockTourService.Setup(s => s.CreateTourAsync(tourDomain)).ReturnsAsync(tourDomain);
        _mockMapper.Setup(m => m.Map<TourDto>(tourDomain)).Returns(tourDto);

        var result = await _controller.CreateTour(tourDto);

        Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        var okResult = (OkObjectResult)result.Result;
        Assert.That(okResult.Value, Is.EqualTo(tourDto));
    }

    [Test]
    public void GetAllTours_HappyPath_ReturnsAllTours()
    {
        var toursDomain = TourTestData.SampleTourDomainList();
        var toursDto = TourTestData.SampleTourDtoList();
        _mockTourService.Setup(s => s.GetAllTours()).Returns(toursDomain);
        _mockMapper.Setup(m => m.Map<IEnumerable<TourDto>>(toursDomain)).Returns(toursDto);

        var result = _controller.GetAllTours();

        Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        var okResult = (OkObjectResult)result.Result;
        Assert.That(okResult.Value, Is.EqualTo(toursDto));
    }

    [Test]
    public void GetTourById_HappyPath_ReturnsTour()
    {
        var tourId = Guid.NewGuid();
        var tourDomain = TourTestData.SampleTourDomain();
        var tourDto = TourTestData.SampleTourDto();
        _mockTourService.Setup(s => s.GetTourById(tourId)).Returns(tourDomain);
        _mockMapper.Setup(m => m.Map<TourDto>(tourDomain)).Returns(tourDto);

        var result = _controller.GetTourById(tourId);

        Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        var okResult = (OkObjectResult)result.Result;
        Assert.That(okResult.Value, Is.EqualTo(tourDto));
    }

    [Test]
    public void GetTourById_ServiceReturnsNull_ReturnsNotFound()
    {
        var tourId = Guid.NewGuid();
        _mockTourService.Setup(s => s.GetTourById(tourId)).Returns((TourDomain?)null);

        var result = _controller.GetTourById(tourId);

        Assert.That(result.Result, Is.TypeOf<NotFoundResult>());
    }

    [Test]
    public async Task UpdateTourAsync_HappyPath_ReturnsUpdatedTour()
    {
        var tourId = Guid.NewGuid();
        var tourDto = TourTestData.SampleTourDto();
        tourDto.Id = tourId;
        var tourDomain = TourTestData.SampleTourDomain();
        _mockMapper.Setup(m => m.Map<TourDomain>(tourDto)).Returns(tourDomain);
        _mockTourService.Setup(s => s.UpdateTourAsync(tourDomain)).ReturnsAsync(tourDomain);
        _mockMapper.Setup(m => m.Map<TourDto>(tourDomain)).Returns(tourDto);

        var result = await _controller.UpdateTour(tourId, tourDto);

        Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
        var okResult = (OkObjectResult)result.Result;
        Assert.That(okResult.Value, Is.EqualTo(tourDto));
    }

    [Test]
    public async Task UpdateTourAsync_UnhappyPath_IdMismatch()
    {
        var tourId = Guid.NewGuid();
        var tourDto = TourTestData.SampleTourDto();
        tourDto.Id = Guid.NewGuid();

        var result = await _controller.UpdateTour(tourId, tourDto);

        Assert.That(result.Result, Is.TypeOf<BadRequestObjectResult>());
        var badRequestResult = (BadRequestObjectResult)result.Result;
        Assert.That(badRequestResult.Value, Is.EqualTo("ID mismatch"));
    }

    [Test]
    public async Task DeleteTourAsync_HappyPath_ReturnsNoContent()
    {
        var tourId = Guid.NewGuid();
        _mockTourService.Setup(s => s.DeleteTourAsync(tourId)).Returns(Task.CompletedTask);

        var result = await _controller.DeleteTour(tourId);

        Assert.That(result, Is.TypeOf<NoContentResult>());
    }

    [Test]
    public void SearchTours_HappyPath_ReturnsMatchingTours()
    {
        const string searchText = TestConstants.ValidSearchText;
        var toursDomain = TourTestData.SampleTourDomainList().AsQueryable();
        var toursDto = TourTestData.SampleTourDtoList();
        _mockTourService.Setup(static s => s.SearchTours(searchText)).Returns(toursDomain);
        _mockMapper
            .Setup(static m => m.Map<IEnumerable<TourDto>>(It.IsAny<IEnumerable<TourDomain>>()))
            .Returns(toursDto);

        var result = _controller.SearchTours(searchText);

        Assert.That(result, Is.TypeOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(okResult.Value, Is.EqualTo(toursDto));
    }

    [Test]
    public void SearchTours_UnhappyPath_NoMatchingTours()
    {
        const string searchText = TestConstants.InvalidSearchText;
        _mockTourService
            .Setup(static s => s.SearchTours(searchText))
            .Returns(new List<TourDomain>().AsQueryable());
        _mockMapper
            .Setup(static m => m.Map<IEnumerable<TourDto>>(It.IsAny<IEnumerable<TourDomain>>()))
            .Returns([]);

        var result = _controller.SearchTours(searchText);

        Assert.That(result, Is.TypeOf<OkObjectResult>());
        var okResult = (OkObjectResult)result;
        Assert.That(((IEnumerable<TourDto>)okResult.Value!).Count(), Is.Zero);
    }
}
