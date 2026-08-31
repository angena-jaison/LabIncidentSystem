using System.ComponentModel.DataAnnotations;
using LabAPI.Models;

namespace LabAPI.DTOs;

// Everything an Administrator needs to manage accounts - the part that
// genuinely does NOT belong to the Reviewer/Manager role.
public class UserSummaryResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class ChangeUserRoleRequest
{
    [Required]
    public UserRole NewRole { get; set; }
}

public class SetUserActiveRequest
{
    [Required]
    public bool IsActive { get; set; }
}

public class ResetPasswordResponse
{
    // A temporary password the Administrator can hand to the user, who
    // should change it after logging in. Simple and explicit on purpose -
    // no email sending required for this project's scope.
    public string TemporaryPassword { get; set; } = string.Empty;
}
