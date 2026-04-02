using BL.DomainModel;
using BL.Interfaces;
using BL.Service;
using DAL.Interfaces;
using DAL.PersistenceModel;
using MapsterMapper;

namespace Tests.BL;

[TestFixture]
public class TourServiceTests
{
    [SetUp]
    public void Setup()
    {
        _mockTourRepository = new Mock<ITourRepository>();
        _mockMapper = new Mock<IMapper>();
        _mockUserContext = TestMocks.UserContext();
        _sut = new TourService(_mockTourRepository.Object, _mockMapper.Object, _mockUserContext.Object);
    }

    private Mock<ITourRepository> _mockTourRepository = null!;
    private Mock<IMapper> _mockMapper = null!;
    private Mock<IUserContext> _mockUserContext = null!;
    private TourService _sut = null!;

    [Test]
    public async Task CreateTourAsync_ValidTour_ReturnsMappedTourDomain()
    {
        var tourDomain = TourTestData.SampleTourDomainList().First();
        var tourPersistence = TourTestData.SampleTourPersistence();
        _mockMapper.Setup(m => m.Map<TourPersistence>(tourDomain)).Returns(tourPersistence);
        _mockMapper.Setup(m => m.Map<TourDomain>(tourPersistence)).Returns(tourDomain);
        _mockTourRepository
            .Setup(r => r.CreateTourAsync(tourPersistence, TestConstants.TestUserId, CancellationToken.None))
            .ReturnsAsync(tourPersistence);

        var result = await _sut.CreateTourAsync(tourDomain);

        Assert.That(result, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Id, Is.EqualTo(tourDomain.Id));
            Assert.That(result.Name, Is.EqualTo(tourDomain.Name));
            Assert.That(result.Description, Is.EqualTo(tourDomain.Description));
        }

        _mockTourRepository.Verify(r => r.CreateTourAsync(tourPersistence, TestConstants.TestUserId, CancellationToken.None), Times.Once);
    }

    [Test]
    public void GetAllToursAsync_ToursExist_ReturnsAllMappedTours()
    {
        var toursPersistence = TourTestData.SampleTourPersistenceList();
        var toursDomain = TourTestData.SampleTourDomainList();
        _mockTourRepository.Setup(r => r.GetAllTours(TestConstants.TestUserId)).Returns(toursPersistence);
        _mockMapper
            .Setup(m => m.Map<IEnumerable<TourDomain>>(toursPersistence))
            .Returns(toursDomain);

        var result = _sut.GetAllTours().ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(toursDomain.Count));
        _mockTourRepository.Verify(r => r.GetAllTours(TestConstants.TestUserId), Times.Once);
    }

    [Test]
    public void GetAllToursAsync_NoToursExist_ReturnsEmptyList()
    {
        _mockTourRepository
            .Setup(static r => r.GetAllTours(TestConstants.TestUserId))
            .Returns([]);
        _mockMapper
            .Setup(static m => m.Map<IEnumerable<TourDomain>>(It.IsAny<IEnumerable<TourPersistence>>()))
            .Returns([]);

        var result = _sut.GetAllTours();

        Assert.That(result, Is.Empty);
    }

    [Test]
    public void GetTourById_ExistingId_ReturnsMappedTourDomain()
    {
        var tourPersistence = TourTestData.SampleTourPersistence();
        var tourDomain = TourTestData.SampleTourDomain();
        _mockTourRepository.Setup(r => r.GetTourById(TestConstants.TestGuid, TestConstants.TestUserId)).Returns(tourPersistence);
        _mockMapper.Setup(m => m.Map<TourDomain>(tourPersistence)).Returns(tourDomain);

        var result = _sut.GetTourById(TestConstants.TestGuid);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(TestConstants.TestGuid));
        _mockTourRepository.Verify(r => r.GetTourById(TestConstants.TestGuid, TestConstants.TestUserId), Times.Once);
    }

    [Test]
    public void GetTourById_NonExistingId_ReturnsNull()
    {
        _mockTourRepository
            .Setup(static r => r.GetTourById(TestConstants.NonexistentGuid, TestConstants.TestUserId))
            .Returns((TourPersistence)null!);

        var result = _sut.GetTourById(TestConstants.NonexistentGuid);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateTourAsync_ExistingTour_ReturnsUpdatedMappedTourDomain()
    {
        var tourDomain = TourTestData.SampleTourDomainList().First();
        var tourPersistence = TourTestData.SampleTourPersistence();
        _mockMapper.Setup(m => m.Map<TourPersistence>(tourDomain)).Returns(tourPersistence);
        _mockMapper.Setup(m => m.Map<TourDomain>(tourPersistence)).Returns(tourDomain);
        _mockTourRepository
            .Setup(r => r.UpdateTourAsync(tourPersistence, TestConstants.TestUserId, CancellationToken.None))
            .ReturnsAsync(tourPersistence);

        var result = await _sut.UpdateTourAsync(tourDomain);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(tourDomain.Id));
        _mockTourRepository.Verify(r => r.UpdateTourAsync(tourPersistence, TestConstants.TestUserId, CancellationToken.None), Times.Once);
    }

    [Test]
    public void UpdateTourAsync_NonExistingTour_ThrowsException()
    {
        var tourDomain = TourTestData.SampleTourDomainList().First();
        var tourPersistence = TourTestData.SampleTourPersistence();
        _mockMapper.Setup(m => m.Map<TourPersistence>(tourDomain)).Returns(tourPersistence);
        _mockTourRepository
            .Setup(r => r.UpdateTourAsync(tourPersistence, TestConstants.TestUserId, CancellationToken.None))
            .ThrowsAsync(new InvalidOperationException("Tour not found"));

        Assert.That(
            () => _sut.UpdateTourAsync(tourDomain),
            Throws.TypeOf<InvalidOperationException>()
                .With.Message.EqualTo("Tour not found"));
    }

    [Test]
    public async Task DeleteTourAsync_ExistingId_CallsRepositoryDelete()
    {
        _mockTourRepository
            .Setup(static r => r.DeleteTourAsync(TestConstants.TestGuid, TestConstants.TestUserId, CancellationToken.None))
            .Returns(Task.CompletedTask);

        await _sut.DeleteTourAsync(TestConstants.TestGuid);

        _mockTourRepository.Verify(static r => r.DeleteTourAsync(TestConstants.TestGuid, TestConstants.TestUserId, CancellationToken.None), Times.Once);
    }

    [Test]
    public void SearchTours_ValidSearchText_ReturnsFilteredMappedTours()
    {
        var tourPersistenceList = TourTestData.SampleTourPersistenceList(3);

        _mockTourRepository.Setup(static r => r.SearchToursAsync(TestConstants.ValidSearchText, TestConstants.TestUserId))
            .Returns(tourPersistenceList.AsQueryable());

        _mockMapper.Setup(static m => m.Map<TourDomain>(It.IsAny<TourPersistence>()))
            .Returns(static (TourPersistence source) =>
            {
                var domain = TourTestData.SampleTourDomain();
                domain.Id = source.Id;
                domain.Name = source.Name;
                return domain;
            });

        var result = _sut.SearchTours(TestConstants.ValidSearchText);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Count(), Is.EqualTo(3));
        _mockTourRepository.Verify(static r => r.SearchToursAsync(TestConstants.ValidSearchText, TestConstants.TestUserId), Times.Once);
    }

    [Test]
    public void SearchTours_NoMatchingTours_ReturnsEmptyQueryable()
    {
        _mockTourRepository
            .Setup(static r => r.SearchToursAsync(TestConstants.InvalidSearchText, TestConstants.TestUserId))
            .Returns(new List<TourPersistence>().AsQueryable());

        var result = _sut.SearchTours(TestConstants.InvalidSearchText);

        Assert.That(result, Is.Empty);
    }
}
