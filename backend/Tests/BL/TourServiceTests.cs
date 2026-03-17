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
        Assert.That(result?.Id, Is.EqualTo(TestConstants.TestGuid));
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
    public void SearchTours_RawFieldMatch_ReturnsFilteredMappedTours()
    {
        ArrangeTour(name: "Vienna City Walk");

        Assert.That(_sut.SearchTours("Vienna").Count(), Is.EqualTo(1));
        _mockTourRepository.Verify(static r => r.GetAllTours(TestConstants.TestUserId), Times.Once);
    }

    [Test]
    public void SearchTours_NoMatch_ReturnsEmpty()
    {
        ArrangeTour();
        Assert.That(_sut.SearchTours(TestConstants.InvalidSearchText), Is.Empty);
    }

    [Test]
    public void SearchTours_BlankQuery_ReturnsAllUserTours()
    {
        ArrangeTour();
        Assert.That(_sut.SearchTours("   ").Count(), Is.EqualTo(1));
    }

    [TestCase("Very popular", 4)]
    [TestCase("Popular", 3)]
    [TestCase("Moderately popular", 2)]
    [TestCase("Less popular", 1)]
    [TestCase("Not popular", 0)]
    public void SearchTours_ComputedFormattedPopularity_Matches(string query, int logs)
    {
        ArrangeTour(logCount: logs);
        Assert.That(_sut.SearchTours(query).Count(), Is.EqualTo(1));
    }

    [Test]
    public void SearchTours_ComputedChildFriendly_MatchesWhenTrue()
    {
        ArrangeTour(logCount: 1, rating: 4.0, difficulty: 1.5);
        Assert.That(_sut.SearchTours("child-friendly").Count(), Is.EqualTo(1));
    }

    [Test]
    public void SearchTours_ComputedChildFriendly_EmptyWhenFalse()
    {
        ArrangeTour(logCount: 1, rating: 2.0, difficulty: 4.0);
        Assert.That(_sut.SearchTours("child-friendly"), Is.Empty);
    }

    [Test]
    public void SearchTours_ComputedAverageRating_MatchesFormattedNumber()
    {
        ArrangeTour(logCount: 1, rating: 4.5);
        Assert.That(_sut.SearchTours("4.5").Count(), Is.EqualTo(1));
    }

    [Test]
    public void SearchTours_ComputedPopularityScore_MatchesLogCountAsText()
    {
        ArrangeTour(logCount: 7);
        Assert.That(_sut.SearchTours("7").Count(), Is.EqualTo(1));
    }

    private void ArrangeTour(string name = "Tour 1", int logCount = 0, double rating = 3.0, double difficulty = 1.0)
    {
        var persistence = TourTestData.SampleTourPersistence(name);
        _mockTourRepository
            .Setup(static r => r.GetAllTours(TestConstants.TestUserId))
            .Returns([persistence]);

        var logs = Enumerable.Range(0, logCount)
            .Select(i => new TourLogDomain
            {
                Id = Guid.NewGuid(),
                DateTime = TestConstants.TestDateTime.AddDays(i),
                Comment = "log",
                Difficulty = difficulty,
                TotalDistance = 5,
                TotalTime = 30,
                Rating = rating
            })
            .ToList();

        _mockMapper.Setup(static m => m.Map<TourDomain>(It.IsAny<TourPersistence>()))
            .Returns((TourPersistence s) => new TourDomain
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                From = s.From,
                To = s.To,
                TransportType = s.TransportType,
                Logs = [.. logs]
            });
    }
}
