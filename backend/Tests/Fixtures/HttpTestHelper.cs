using System.Net;
using System.Net.Http.Json;

namespace Tests.Fixtures;

public static class HttpTestHelper
{
    public static void SetupSuccess(Mock<HttpMessageHandler> mockHandler, object responseBody)
    {
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = responseBody is string s
                ? new StringContent(s, Encoding.UTF8, "application/json")
                : JsonContent.Create(responseBody, responseBody.GetType())
        };

        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(response);
    }

    public static void SetupError(Mock<HttpMessageHandler> mockHandler, HttpStatusCode statusCode, string content)
    {
        var response = new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(content, Encoding.UTF8, "text/plain")
        };

        mockHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(response);
    }

    public static void VerifyPostRequest(Mock<HttpMessageHandler> mockHandler, string expectedEndpoint)
    {
        mockHandler
            .Protected()
            .Verify(
                "SendAsync",
                Times.Once(),
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Method == HttpMethod.Post &&
                    req.RequestUri!.ToString().Contains(expectedEndpoint)),
                ItExpr.IsAny<CancellationToken>());
    }

    public static void VerifyRequestHeaders(Mock<HttpMessageHandler> mockHandler, string expectedApiKey)
    {
        mockHandler
            .Protected()
            .Verify(
                "SendAsync",
                Times.Once(),
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Headers.Authorization != null &&
                    req.Headers.Authorization.Scheme == "Bearer" &&
                    req.Headers.Authorization.Parameter == expectedApiKey &&
                    req.Headers.Accept.Any(static h => h.MediaType == "application/json")),
                ItExpr.IsAny<CancellationToken>());
    }
}
