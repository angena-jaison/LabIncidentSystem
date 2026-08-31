using System.Net;
using System.Net.Http.Json;
using LabAPI.DTOs;
using Xunit;
using FluentAssertions;

namespace LabAPI.Tests;

// A "real" end-to-end test: spins up the whole API in memory (via
// CustomWebApplicationFactory, which swaps SQL Server for an in-memory DB),
// registers a user, logs in, and exercises the incident workflow through
// actual HTTP calls - the same way the frontend or Swagger would.
public class IncidentsControllerIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public IncidentsControllerIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> RegisterAndLoginAsync()
    {
        var email = $"user{Guid.NewGuid():N}@test.com";

        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            FullName = "Integration Test User",
            Email = email,
            Password = "Password123!"
        });

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = "Password123!"
        });

        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        return auth!.Token;
    }

    [Fact]
    public async Task FullWorkflow_CreateIncident_ThenFetchIt_Succeeds()
    {
        var token = await RegisterAndLoginAsync();
        _client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/api/incidents", new CreateIncidentRequest
        {
            Title = "Gas leak detected",
            Description = "Sensor triggered near bay 2.",
            Category = "Gas Leak",
            Severity = LabAPI.Models.IncidentSeverity.Critical,
            OccurredAtUtc = DateTime.UtcNow
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<IncidentResponse>();
        created!.Status.Should().Be("Open");

        var getResponse = await _client.GetAsync($"/api/incidents/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetIncidents_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/incidents");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
