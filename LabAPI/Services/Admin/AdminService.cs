using LabAPI.Data;
using LabAPI.DTOs;
using LabAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LabAPI.Services.Admin;

public class AdminService : IAdminService
{
    private readonly AppDbContext _db;

    public AdminService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<UserSummaryResponse>> GetAllUsersAsync()
    {
        return await _db.Users
            .OrderBy(u => u.FullName)
            .Select(u => ToSummary(u))
            .ToListAsync();
    }

    public async Task<UserSummaryResponse> ChangeRoleAsync(int userId, UserRole newRole, int currentAdminUserId)
    {
        var user = await FindOrThrow(userId);

        if (user.Id == currentAdminUserId && newRole != UserRole.Administrator)
            throw new InvalidOperationException("You can't remove your own Administrator role.");

        user.Role = newRole;
        await _db.SaveChangesAsync();
        return ToSummary(user);
    }

    public async Task<UserSummaryResponse> SetActiveAsync(int userId, bool isActive, int currentAdminUserId)
    {
        var user = await FindOrThrow(userId);

        if (user.Id == currentAdminUserId && !isActive)
            throw new InvalidOperationException("You can't deactivate your own account.");

        user.IsActive = isActive;
        await _db.SaveChangesAsync();
        return ToSummary(user);
    }

    public async Task<string> ResetPasswordAsync(int userId)
    {
        var user = await FindOrThrow(userId);

        // A short, random temporary password. Good enough for a student
        // project; a production system would email a reset link instead.
        var tempPassword = "Temp-" + Guid.NewGuid().ToString("N")[..8];

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
        await _db.SaveChangesAsync();

        return tempPassword;
    }

    private async Task<User> FindOrThrow(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException($"User #{userId} was not found.");
        return user;
    }

    private static UserSummaryResponse ToSummary(User u) => new()
    {
        Id = u.Id,
        FullName = u.FullName,
        Email = u.Email,
        Role = u.Role.ToString(),
        IsActive = u.IsActive,
        CreatedAtUtc = u.CreatedAtUtc
    };
}
