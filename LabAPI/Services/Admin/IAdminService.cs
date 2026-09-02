using LabAPI.DTOs;
using LabAPI.Models;

namespace LabAPI.Services.Admin;

// Everything here is Administrator-only (enforced again at the controller
// with [Authorize(Roles = "Administrator")] - this service doesn't re-check
// the role itself, that's the controller's job, same pattern as the rest
// of the app).
public interface IAdminService
{
    Task<List<UserSummaryResponse>> GetAllUsersAsync(AdminUserQueryParams query);
    Task<UserSummaryResponse> ChangeRoleAsync(int userId, UserRole newRole, int currentAdminUserId);
    Task<UserSummaryResponse> SetActiveAsync(int userId, bool isActive, int currentAdminUserId);
    Task<string> ResetPasswordAsync(int userId);
}
