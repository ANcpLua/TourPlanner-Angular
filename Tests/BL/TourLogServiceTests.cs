using BL.DomainModel;
using BL.Interfaces;
using BL.Service;
using DAL.Interfaces;
using DAL.PersistenceModel;
using MapsterMapper;
using Microsoft.EntityFrameworkCore;

namespace Tests.BL;

[TestFixture]
public class TourLogServiceTests
{
    [SetUp]
    public void Setup()
    {
        _mockTourLogRepository = new Mock<ITourLogRepository>();
        _mockMapper = new Mock<IMapper>();
        _mockUserContext = TestMocks.UserContext();
        _sut = new TourLogService(_mockTourLogRepository.Object, _mockMapper.Object, _mockUserContext.Object);
    }

    private Mock<ITourLogRepository> _mockTourLogRepository = null!;
    private Mock<IMapper> _mockMapper = null!;
    private Mock<IUserContext> _mockUserContext = null!;
    private TourLogService _sut = null!;

    [Test]
    public async Task CreateTourLogAsync_ValidTourLog_ReturnsMappedTourLogDomain()
    {
        var tourLogDomain = TourLogTestData.SampleTourLogDomainList().First();
        var tourLogPersistence = TourLogTestData.SampleTourLogPersistence();
        _mockMapper
            .Setup(m => m.Map<TourLogPersistence>(tourLogDomain))
            .Returns(tourLogPersistence);
        _mockMapper.Setup(m => m.Map<TourLogDomain>(tourLogPersistence)).Returns(tourLogDomain);
        _mockTourLogRepository
            .Setup(r => r.CreateTourLogAsync(tourLogPersistence, TestConstants.TestUserId, CancellationToken.None))
            .ReturnsAsync(tourLogPersistence);

        var result = await _sut.CreateTourLogAsync(tourLogDomain);

        Assert.That(result, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Id, Is.EqualTo(tourLogDomain.Id));
            Assert.That(result.Comment, Is.EqualTo(tourLogDomain.Comment));
            Assert.That(result.DateTime, Is.EqualTo(tourLogDomain.DateTime));
        }

        _mockTourLogRepository.Verify(
            r => r.CreateTourLogAsync(tourLogPersistence, TestConstants.TestUserId, CancellationToken.None),
            Times.Once
        );
    }

    [Test]
    public void GetTourLogById_ExistingId_ReturnsMappedTourLogDomain()
    {
        var tourLogPersistence = TourLogTestData.SampleTourLogPersistence();

        _mockTourLogRepository
            .Setup(r => r.GetTourLogById(tourLogPersistence.Id, TestConstants.TestUserId))
            .Returns(tourLogPersistence);

        _mockMapper.Setup(static m => m.Map<TourLogDomain>(It.IsAny<TourLogPersistence>()))
            .Returns(static (TourLogPersistence source) =>
            {
                var domain = TourLogTestData.SampleTourLogDomain();
                domain.Id = source.Id;
                return domain;
            });

        var result = _sut.GetTourLogById(tourLogPersistence.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(tourLogPersistence.Id));
        _mockTourLogRepository.Verify(r => r.GetTourLogById(tourLogPersistence.Id, TestConstants.TestUserId), Times.Once);
    }

    [Test]
    public void GetTourLogById_NonExistingId_ReturnsNull()
    {
        _mockTourLogRepository
            .Setup(static r => r.GetTourLogById(TestConstants.NonexistentGuid, TestConstants.TestUserId))
            .Returns((TourLogPersistence)null!);

        var result = _sut.GetTourLogById(TestConstants.NonexistentGuid);

        Assert.That(result, Is.Null);
    }

    [Test]
    public void GetTourLogsByTourId_ExistingTourId_ReturnsAllMappedTourLogs()
    {
        var tourLogsPersistence = TourLogTestData.SampleTourLogPersistenceList();
        var tourLogsDomain = TourLogTestData.SampleTourLogDomainList();
        _mockTourLogRepository
            .Setup(r => r.GetTourLogsByTourId(TestConstants.TestGuid, TestConstants.TestUserId)).Returns(tourLogsPersistence);

        _mockMapper
            .Setup(m => m.Map<IEnumerable<TourLogDomain>>(tourLogsPersistence))
            .Returns(tourLogsDomain);

        var result = _sut.GetTourLogsByTourId(TestConstants.TestGuid).ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(tourLogsDomain.Count));
        _mockTourLogRepository.Verify(
            r => r.GetTourLogsByTourId(TestConstants.TestGuid, TestConstants.TestUserId),
            Times.Once
        );
    }

    [Test]
    public void GetTourLogsByTourId_NonExistingTourId_ReturnsEmptyList()
    {
        _mockTourLogRepository
            .Setup(static r => r.GetTourLogsByTourId(TestConstants.NonexistentGuid, TestConstants.TestUserId));
        _mockMapper
            .Setup(static m =>
                m.Map<IEnumerable<TourLogDomain>>(It.IsAny<IEnumerable<TourLogPersistence>>())
            )
            .Returns([]);

        var result = _sut.GetTourLogsByTourId(TestConstants.NonexistentGuid);

        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task UpdateTourLogAsync_ExistingTourLog_ReturnsUpdatedMappedTourLogDomain()
    {
        var tourLogDomain = TourLogTestData.SampleTourLogDomainList().First();
        var tourLogPersistence = TourLogTestData.SampleTourLogPersistence();
        _mockMapper
            .Setup(m => m.Map<TourLogPersistence>(tourLogDomain))
            .Returns(tourLogPersistence);
        _mockMapper.Setup(m => m.Map<TourLogDomain>(tourLogPersistence)).Returns(tourLogDomain);
        _mockTourLogRepository
            .Setup(r => r.UpdateTourLogAsync(tourLogPersistence, TestConstants.TestUserId, CancellationToken.None))
            .ReturnsAsync(tourLogPersistence);

        var result = await _sut.UpdateTourLogAsync(tourLogDomain);

        Assert.That(result, Is.Not.Null);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(result.Id, Is.EqualTo(tourLogDomain.Id));
            Assert.That(result.Comment, Is.EqualTo(tourLogDomain.Comment));
            Assert.That(result.DateTime, Is.EqualTo(tourLogDomain.DateTime));
        }

        _mockTourLogRepository.Verify(
            r => r.UpdateTourLogAsync(tourLogPersistence, TestConstants.TestUserId, CancellationToken.None),
            Times.Once
        );
    }

    [Test]
    public void UpdateTourLogAsync_NonExistingTourLog_ThrowsException()
    {
        var tourLogDomain = TourLogTestData.SampleTourLogDomainList().First();
        var tourLogPersistence = TourLogTestData.SampleTourLogPersistence();
        _mockMapper
            .Setup(m => m.Map<TourLogPersistence>(tourLogDomain))
            .Returns(tourLogPersistence);
        _mockTourLogRepository
            .Setup(r => r.UpdateTourLogAsync(tourLogPersistence, TestConstants.TestUserId, CancellationToken.None))
            .ThrowsAsync(new InvalidOperationException("Tour log not found"));

        Assert.That(
            () => _sut.UpdateTourLogAsync(tourLogDomain),
            Throws.TypeOf<InvalidOperationException>()
                .With.Message.EqualTo("Tour log not found"));
    }

    [Test]
    public async Task DeleteTourLogAsync_ExistingId_CallsRepositoryDelete()
    {
        var tourLogId = TourLogTestData.SampleTourLogPersistence().Id;
        _mockTourLogRepository
            .Setup(r => r.DeleteTourLogAsync(tourLogId, TestConstants.TestUserId, CancellationToken.None))
            .Returns(Task.CompletedTask);

        await _sut.DeleteTourLogAsync(tourLogId);

        _mockTourLogRepository.Verify(r => r.DeleteTourLogAsync(tourLogId, TestConstants.TestUserId, CancellationToken.None), Times.Once);
    }

    [Test]
    public void DeleteTourLogAsync_NonExistingId_DoesNotThrowException()
    {
        _mockTourLogRepository
            .Setup(r => r.DeleteTourLogAsync(TestConstants.NonexistentGuid, TestConstants.TestUserId, CancellationToken.None))
            .Returns(Task.CompletedTask);

        Assert.That(
            () => _sut.DeleteTourLogAsync(TestConstants.NonexistentGuid),
            Throws.Nothing);
    }

    [Test]
    public void CreateTourLogAsync_CancellationRequested_ThrowsOperationCanceledException()
    {
        var tourLogDomain = TourLogTestData.SampleTourLogDomainList().First();
        var tourLogPersistence = TourLogTestData.SampleTourLogPersistence();
        _mockMapper
            .Setup(m => m.Map<TourLogPersistence>(tourLogDomain))
            .Returns(tourLogPersistence);
        _mockTourLogRepository
            .Setup(r => r.CreateTourLogAsync(tourLogPersistence, TestConstants.TestUserId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        Assert.That(
            () => _sut.CreateTourLogAsync(tourLogDomain, new CancellationToken(canceled: true)),
            Throws.TypeOf<OperationCanceledException>());
    }

    [Test]
    public void GetTourLogsByTourId_LargeTourLogCount_HandlesLargeDataSet()
    {
        List<TourLogPersistence> largeTourLogList = [.. Enumerable
            .Range(0, 10000)
            .Select(static _ => TourLogTestData.SampleTourLogPersistence())];

        List<TourLogDomain> largeTourLogDomainList = [.. Enumerable
            .Range(0, 10000)
            .Select(static _ => TourLogTestData.SampleTourLogDomainList().First())];

        _mockTourLogRepository
            .Setup(r => r.GetTourLogsByTourId(TestConstants.TestGuid, TestConstants.TestUserId)).Returns(largeTourLogList);

        _mockMapper
            .Setup(m => m.Map<IEnumerable<TourLogDomain>>(largeTourLogList))
            .Returns(largeTourLogDomainList);

        var result = _sut.GetTourLogsByTourId(TestConstants.TestGuid).ToList();

        Assert.That(result, Is.Not.Null);
        Assert.That(result, Has.Count.EqualTo(largeTourLogDomainList.Count));
        _mockTourLogRepository.Verify(
            r => r.GetTourLogsByTourId(TestConstants.TestGuid, TestConstants.TestUserId),
            Times.Once
        );
    }

    [Test]
    public async Task UpdateTourLogAsync_ConcurrentUpdates_HandlesRaceCondition()
    {
        var tourLogDomain = TourLogTestData.SampleTourLogDomainList().First();
        var tourLogPersistence = TourLogTestData.SampleTourLogPersistence();
        _mockMapper
            .Setup(m => m.Map<TourLogPersistence>(tourLogDomain))
            .Returns(tourLogPersistence);
        _mockMapper.Setup(m => m.Map<TourLogDomain>(tourLogPersistence)).Returns(tourLogDomain);

        _mockTourLogRepository
            .SetupSequence(r => r.UpdateTourLogAsync(tourLogPersistence, TestConstants.TestUserId, CancellationToken.None))
            .ThrowsAsync(new DbUpdateConcurrencyException("Update conflict"))
            .ReturnsAsync(tourLogPersistence);

        Assert.That(
            () => _sut.UpdateTourLogAsync(tourLogDomain),
            Throws.TypeOf<DbUpdateConcurrencyException>());
        var result = await _sut.UpdateTourLogAsync(tourLogDomain);
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(tourLogDomain.Id));
    }
}
