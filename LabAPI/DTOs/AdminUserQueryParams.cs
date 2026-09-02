namespace LabAPI.DTOs;

public class AdminUserQueryParams
{
    public string? Search { get; set; }

    // null = all users
    // true = activated users
    // false = deactivated users
    public bool? IsActive { get; set; }
}