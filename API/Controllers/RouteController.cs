using Contracts.Routes;
using BL.Interface;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/routes")]
public class RouteController(IRouteService routeService) : ControllerBase
{
    [HttpPost("resolve")]
    public async Task<ActionResult<ResolveRouteResponse>> ResolveRoute(
        [FromBody] ResolveRouteRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var route = await routeService.ResolveRouteAsync(
            (request.FromLatitude!.Value, request.FromLongitude!.Value),
            (request.ToLatitude!.Value, request.ToLongitude!.Value),
            request.TransportType,
            cancellationToken
        );

        return Ok(new ResolveRouteResponse
        {
            Distance = route.Distance,
            Duration = route.Duration
        });
    }
}
