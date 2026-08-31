using System.ComponentModel.DataAnnotations;

namespace LabAPI.Models;

public class Incident
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Category { get; set; } = string.Empty; // e.g. "Chemical Spill", "Equipment Failure"

    public IncidentSeverity Severity { get; set; } = IncidentSeverity.Low;

    public IncidentStatus Status { get; set; } = IncidentStatus.Open;

    [MaxLength(150)]
    public string? Equipment { get; set; } // equipment / context involved, optional

    // When the incident actually happened (can differ from when it was logged).
    public DateTime OccurredAtUtc { get; set; }

    // --- Audit fields ---
    public int CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public int? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // --- Resolution info ---
    [MaxLength(4000)]
    public string? ResolutionDetails { get; set; }

    // --- Navigation collections ---
    public List<StatusHistory> StatusHistory { get; set; } = new();
    public List<InvestigationNote> InvestigationNotes { get; set; } = new();
    public List<CorrectiveAction> CorrectiveActions { get; set; } = new();
}
