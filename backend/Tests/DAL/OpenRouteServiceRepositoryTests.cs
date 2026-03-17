using System.Net;
using DAL.Adapter;

namespace Tests.DAL;

[TestFixture]
public class OpenRouteServiceRepositoryTests
{
    [SetUp]
    public void Setup()
    {
        _mockHandler = new Mock<HttpMessageHandler>();
        _mockConfig = new Mock<IConfiguration>();
        _mockConfig.Setup(static c => c["AppSettings:OpenRouteServiceApiKey"]).Returns("test-api-key");
        _mockConfig.Setup(static c => c["AppSettings:OpenRouteServiceApiBaseUrl"]).Returns("https://api.openrouteservice.org");

        var httpClient = new HttpClient(_mockHandler.Object);
        var mockFactory = new Mock<IHttpClientFactory>();
        mockFactory.Setup(static f => f.CreateClient("OpenRouteService")).Returns(httpClient);
        _sut = new OpenRouteServiceRepository(mockFactory.Object, _mockConfig.Object);
    }

    private Mock<HttpMessageHandler> _mockHandler = null!;
    private Mock<IConfiguration> _mockConfig = null!;
    private OpenRouteServiceRepository _sut = null!;

    private static readonly double[] ExpectedFirstPoint = [16.3738, 48.2082];
    private static readonly double[] ExpectedLastPoint = [13.4050, 52.5200];

    private const string ValidRouteResponse = """
        {
            "features": [{
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [16.3738, 48.2082],
                        [14.9456, 50.1234],
                        [13.4050, 52.5200]
                    ]
                },
                "properties": {
                    "summary": {
                        "distance": 523400.0,
                        "duration": 18000.0
                    }
                }
            }]
        }
        """;

    [TestCase("Car", "driving-car")]
    [TestCase("Bike", "cycling-regular")]
    [TestCase("Foot", "foot-walking")]
    public async Task ResolveRouteAsync_TransportTypes_MapsToCorrectGeoJsonEndpoint(string transportType, string expectedEndpoint)
    {
        HttpTestHelper.SetupSuccess(_mockHandler, ValidRouteResponse);

        await _sut.ResolveRouteAsync(TestConstants.TestCoordinates, (52.52, 13.405), transportType);

        HttpTestHelper.VerifyPostRequest(_mockHandler, $"v2/directions/{expectedEndpoint}/geojson");
    }

    [Test]
    public async Task ResolveRouteAsync_ValidResponse_ReturnsDistanceDurationAndGeometry()
    {
        HttpTestHelper.SetupSuccess(_mockHandler, ValidRouteResponse);

        var route = await _sut.ResolveRouteAsync(
            TestConstants.TestCoordinates, (52.52, 13.405), "Car");

        using (Assert.EnterMultipleScope())
        {
            Assert.That(route.Distance, Is.EqualTo(523400.0));
            Assert.That(route.Duration, Is.EqualTo(18000.0));
            Assert.That(route.Geometry, Has.Length.EqualTo(3));
            Assert.That(route.Geometry[0], Is.EqualTo(ExpectedFirstPoint));
            Assert.That(route.Geometry[2], Is.EqualTo(ExpectedLastPoint));
        }
    }

    [Test]
    public async Task ResolveRouteAsync_SetsAuthorizationAndAcceptHeaders()
    {
        HttpTestHelper.SetupSuccess(_mockHandler, ValidRouteResponse);

        await _sut.ResolveRouteAsync(TestConstants.TestCoordinates, (52.52, 13.405), "Car");

        HttpTestHelper.VerifyRequestHeaders(_mockHandler, "test-api-key");
    }

    [Test]
    public async Task ResolveRouteAsync_PostsToCorrectEndpoint()
    {
        HttpTestHelper.SetupSuccess(_mockHandler, ValidRouteResponse);

        await _sut.ResolveRouteAsync((48.2082, 16.3738), (52.52, 13.405), "Car");

        HttpTestHelper.VerifyPostRequest(_mockHandler, "v2/directions/driving-car/geojson");
    }

    [Test]
    public void ResolveRouteAsync_UnsupportedTransportType_ThrowsArgumentOutOfRangeException()
    {
        Assert.That(
            () => _sut.ResolveRouteAsync(TestConstants.TestCoordinates, (52.52, 13.405), "Segway"),
            Throws.TypeOf<ArgumentOutOfRangeException>());
    }

    [Test]
    public void ResolveRouteAsync_ServerError_ThrowsHttpRequestException()
    {
        HttpTestHelper.SetupError(_mockHandler, HttpStatusCode.InternalServerError, "Server Error");

        Assert.That(
            () => _sut.ResolveRouteAsync(TestConstants.TestCoordinates, (52.52, 13.405), "Car"),
            Throws.TypeOf<HttpRequestException>());
    }

    [Test]
    public void ResolveRouteAsync_MissingApiKey_ThrowsInvalidOperationException()
    {
        _mockConfig.Setup(static c => c["AppSettings:OpenRouteServiceApiKey"]).Returns((string?)null);

        Assert.That(
            () => _sut.ResolveRouteAsync(TestConstants.TestCoordinates, (52.52, 13.405), "Car"),
            Throws.TypeOf<InvalidOperationException>());
    }

    [Test]
    public void ResolveRouteAsync_MissingBaseUrl_ThrowsInvalidOperationException()
    {
        _mockConfig.Setup(static c => c["AppSettings:OpenRouteServiceApiBaseUrl"]).Returns((string?)null);

        Assert.That(
            () => _sut.ResolveRouteAsync(TestConstants.TestCoordinates, (52.52, 13.405), "Car"),
            Throws.TypeOf<InvalidOperationException>());
    }
}
