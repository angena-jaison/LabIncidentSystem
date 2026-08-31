using System.Security.Claims;
using LabAPI.DTOs;
using LabAPI.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LabAPI.Controllers;

// Every endpoint here is Administrator-only. This is deliberately the ONLY
// controller that touches user accounts/roles/passwords - Reviewers cannot
// reach any of this, which is the whole point of having a separate
// Administrator role instead of merging it with Reviewer.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _adminService.GetAllUsersAsync();
        return Ok(users);
    }

    // PATCH /api/admin/users/5/role
    [HttpPatch("users/{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, ChangeUserRoleRequest request)
    {
        var result = await _adminService.ChangeRoleAsync(id, request.NewRole, CurrentUserId);
        return Ok(result);
    }

    // PATCH /api/admin/users/5/active
    [HttpPatch("users/{id:int}/active")]
    public async Task<IActionResult> SetActive(int id, SetUserActiveRequest request)
    {
        var result = await _adminService.SetActiveAsync(id, request.IsActive, CurrentUserId);
        return Ok(result);
    }

    // POST /api/admin/users/5/reset-password
    [HttpPost("users/{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id)
    {
        var tempPassword = await _adminService.ResetPasswordAsync(id);
        return Ok(new ResetPasswordResponse { TemporaryPassword = tempPassword });
    }
}
