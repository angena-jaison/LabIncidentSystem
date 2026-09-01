using LabAPI.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;

namespace LabAPI.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // 1. Create a shared root so the DB isn't destroyed between HTTP requests
    private readonly InMemoryDatabaseRoot _dbRoot = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // 2. Find the real SQL Server DbContext registration and remove it
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>)); // NOTE: If your context is named something else (e.g., LabDbContext), change it here!

            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // 3. Add the In-Memory database using the shared root
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase("IntegrationTestsDb", _dbRoot);
            });

            // 4. Ensure the database schema is created for the tests
            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }
}