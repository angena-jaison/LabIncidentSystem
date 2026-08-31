using System.ComponentModel.DataAnnotations;

namespace LabAPI.Models;

public class CorrectiveAction
{
    public int Id { get; set; }

    public int IncidentId { get; set; }
    public Incident? Incident { get; set; }

    [Required, MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public bool IsCompleted { get; set; } = false;

    public DateTime? DueDateUtc { get; set; }

    public int CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
