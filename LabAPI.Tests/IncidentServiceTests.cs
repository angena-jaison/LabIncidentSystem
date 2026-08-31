using LabAPI.Data;
using LabAPI.DTOs;
using LabAPI.Models;
using LabAPI.Services.Incidents;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FluentAssertions;

namespace LabAPI.Tests;

// Uses EF Core's InMemory provider so these tests run fast, with no real
// SQL Server needed, and each test gets a fresh, isolated database.
public class IncidentServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options);

        db.Users.Add(new User { Id = 1, FullName = "Test User", Email = "t@test.com", PasswordHash = "x" });
        db.SaveChanges();

        return db;
    }

    [Fact]
    public async Task CreateAsync_NewIncident_StartsAsOpen()
    {
        var db = CreateDb();
        var service = new IncidentService(db);

        var result = await service.CreateAsync(new CreateIncidentRequest
        {
            Title = "Spill in fume hood",
            Description = "Small acid spill, contained immediately.",
            Category = "Chemical Spill",
            Severity = IncidentSeverity.Medium,
            OccurredAtUtc = DateTime.UtcNow
        }, currentUserId: 1);

        result.Status.Should().Be(IncidentStatus.Open.ToString());
    }

    [Fact]
    public async Task ChangeStatusAsync_OpenToInvestigating_Succeeds()
    {
        var db = CreateDb();
        var service = new IncidentService(db);

        var incident = await service.CreateAsync(new CreateIncidentRequest
        {
            Title = "Equipment alarm",
            Description = "Fridge alarm triggered overnight.",
            Category = "Equipment Failure",
            Severity = IncidentSeverity.Low,
            OccurredAtUtc = DateTime.UtcNow
        }, currentUserId: 1);

        var updated = await service.ChangeStatusAsync(
            incident.Id,
            new ChangeStatusRequest { NewStatus = IncidentStatus.Investigating },
            currentUserId: 1);

        updated.Status.Should().Be(IncidentStatus.Investigating.ToString());
    }

    [Fact]
    public async Task ChangeStatusAsync_SkippingStraightToClosed_Throws()
    {
        var db = CreateDb();
        var service = new IncidentService(db);

        var incident = await service.CreateAsync(new CreateIncidentRequest
        {
            Title = "Minor spill",
            Description = "Water spill near workstation.",
            Category = "Other",
            Severity = IncidentSeverity.Low,
            OccurredAtUtc = DateTime.UtcNow
        }, currentUserId: 1);

        // Open -> Closed is NOT an allowed transition (must go through
        // Investigating and Resolved first). This protects the workflow.
        var act = async () => await service.ChangeStatusAsync(
            incident.Id,
            new ChangeStatusRequest { NewStatus = IncidentStatus.Closed },
            currentUserId: 1);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GetByIdAsync_UnknownId_ThrowsNotFound()
    {
        var db = CreateDb();
        var service = new IncidentService(db);

        var act = async () => await service.GetByIdAsync(999);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}
