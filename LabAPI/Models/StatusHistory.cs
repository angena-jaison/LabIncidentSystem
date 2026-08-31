namespace LabAPI.Models;

// One row per status change. Lets us show "who changed what, and when".
public class StatusHistory
{
    public int Id { get; set; }

    public int IncidentId { get; set; }
    public Incident? Incident { get; set; }

    public IncidentStatus FromStatus { get; set; }
    public IncidentStatus ToStatus { get; set; }

    public int ChangedByUserId { get; set; }
    public User? ChangedByUser { get; set; }

    public DateTime ChangedAtUtc { get; set; } = DateTime.UtcNow;

    public string? Note { get; set; }
}
