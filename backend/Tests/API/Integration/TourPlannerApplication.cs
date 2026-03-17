using DAL.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Tests.API.Integration;

internal sealed class TourPlannerApplication : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"TourPlannerTest_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<TourPlannerContext>();
            services.RemoveAll<DbContextOptions<TourPlannerContext>>();
            services.AddDbContext<TourPlannerContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
            services.Configure<HealthCheckServiceOptions>(options =>
            {
                options.Registrations.Clear();
                options.Registrations.Add(new HealthCheckRegistration(
                    "test-health",
                    static _ => new HealthyHealthCheck(),
                    null,
                    null));
            });
        });
    }

    private sealed class HealthyHealthCheck : IHealthCheck
    {
        public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(HealthCheckResult.Healthy());
        }
    }
}
