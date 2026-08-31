using System.ComponentModel.DataAnnotations;

namespace LabAPI.Models;

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    // We never store the raw password. Only the BCrypt hash of it.
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.LabUser;

    // Administrator-managed: a deactivated account can no longer log in.
    // This is what "manages accounts" means in practice - see AdminController.
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
