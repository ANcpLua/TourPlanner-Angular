using BL.Service;
using Contracts.Routes;
using DAL.Interfaces;

namespace Tests.BL;

[TestFixture]
public class RouteServiceTests
{
    [SetUp]
    public void Setup()
    {
        _mockRepository = new Mock<IRouteRepository>();
        _sut = new RouteService(_mockRepository.Object);
    }

    private Mock<IRouteRepository> _mockRepository = null!;
    private RouteService _sut = null!;

    [Test]
    public async Task ResolveRouteAsync_DelegatesToRepository()
    {
        var expected = new ResolvedRoute(523400.0, 18000.0, [[16.3738, 48.2082], [13.405, 52.52]]);
        _mockRepository
            .Setup(static r => r.ResolveRouteAsync(
                It.IsAny<(double, double)>(),
                It.IsAny<(double, double)>(),
                "Car",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        var route = await _sut.ResolveRouteAsync(
            (48.2082, 16.3738), (52.52, 13.405), "Car");

        using (Assert.EnterMultipleScope())
        {
            Assert.That(route.Distance, Is.EqualTo(523400.0));
            Assert.That(route.Duration, Is.EqualTo(18000.0));
            Assert.That(route.Geometry, Has.Length.EqualTo(2));
        }
    }
}
