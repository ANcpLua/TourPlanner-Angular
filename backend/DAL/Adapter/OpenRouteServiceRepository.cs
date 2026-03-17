using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Contracts.Routes;
using DAL.Interfaces;
using Microsoft.Extensions.Configuration;

namespace DAL.Adapter;

public class OpenRouteServiceRepository(IHttpClientFactory httpClientFactory, IConfiguration configuration) : IRouteRepository
{
    public async Task<ResolvedRoute> ResolveRouteAsync(
        (double Latitude, double Longitude) from,
        (double Latitude, double Longitude) destination,
        string transportType,
        CancellationToken cancellationToken = default
    )
    {
        var endpoint = GetEndpointForTransportType(transportType);
        var apiKey = configuration["AppSettings:OpenRouteServiceApiKey"]
                     ?? throw new InvalidOperationException("OpenRouteService API key is not configured.");
        var baseUrl = configuration["AppSettings:OpenRouteServiceApiBaseUrl"]
                      ?? throw new InvalidOperationException("OpenRouteService base URL is not configured.");

        using var client = httpClientFactory.CreateClient("OpenRouteService");
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        using var content = new StringContent(
            JsonSerializer.Serialize(new
            {
                coordinates = (double[][])[[from.Longitude, from.Latitude], [destination.Longitude, destination.Latitude]]
            }),
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync($"{baseUrl}/v2/directions/{endpoint}/geojson", content, cancellationToken);
        response.EnsureSuccessStatusCode();

        using var json = await JsonDocument.ParseAsync(
          await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        var feature = json.RootElement.GetProperty("features")[0];
        var summary = feature.GetProperty("properties").GetProperty("summary");
        var coordinates = feature.GetProperty("geometry").GetProperty("coordinates");

        var geometry = new double[coordinates.GetArrayLength()][];
        for (var i = 0; i < geometry.Length; i++)
        {
            var point = coordinates[i];
            geometry[i] = [point[0].GetDouble(), point[1].GetDouble()];
        }

        return new ResolvedRoute(
            summary.GetProperty("distance").GetDouble(),
            summary.GetProperty("duration").GetDouble(),
            geometry
        );
    }

    private static string GetEndpointForTransportType(string transportType)
    {
        return transportType switch
        {
            "Car" => "driving-car",
            "Bike" => "cycling-regular",
            "Foot" => "foot-walking",
            _ => throw new ArgumentOutOfRangeException(nameof(transportType), transportType, "Unsupported transport type")
        };
    }
}
