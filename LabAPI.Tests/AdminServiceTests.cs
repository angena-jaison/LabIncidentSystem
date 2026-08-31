using LabAPI.Data;
using LabAPI.Models;
using LabAPI.Services.Admin;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FluentAssertions;

namespace LabAPI.Tests;

public class AdminServiceTests
{
    private static AppDbContext CreateDb(out User admin)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options);

        admin = new User { FullName = "Admin", Email = "admin@test.com", PasswordHash = "x", Role = UserRole.Administrator };
        db.Users.Add(admin);
        db.Users.Add(new User { FullName = "Reviewer", Email = "rev@test.com", PasswordHash = "x", Role = UserRole.Reviewer });
        db.SaveChanges();

        return db;
    }

    [Fact]
    public async Task ChangeRoleAsync_AdminDemotesSelf_Throws()
    {
        var db = CreateDb(out var admin);
        var service = new AdminService(db);

        var act = async () => await service.ChangeRoleAsync(admin.Id, UserRole.LabUser, currentAdminUserId: admin.Id);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task SetActiveAsync_AdminDeactivatesSelf_Throws()
    {
        var db = CreateDb(out var admin);
        var service = new AdminService(db);

        var act = async () => await service.SetActiveAsync(admin.Id, false, currentAdminUserId: admin.Id);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task SetActiveAsync_DeactivatingAnotherUser_Succeeds()
    {
        var db = CreateDb(out var admin);
        var reviewer = db.Users.Single(u => u.Email == "rev@test.com");
        var service = new AdminService(db);

        var result = await service.SetActiveAsync(reviewer.Id, false, currentAdminUserId: admin.Id);

        result.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task ResetPasswordAsync_ReturnsANonEmptyTemporaryPassword()
    {
        var db = CreateDb(out var admin);
        var service = new AdminService(db);

        var tempPassword = await service.ResetPasswordAsync(admin.Id);

        tempPassword.Should().NotBeNullOrWhiteSpace();
    }
}
