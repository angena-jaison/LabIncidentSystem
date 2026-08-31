using System.ComponentModel.DataAnnotations;

namespace LabAPI.Models;

public class InvestigationNote
{
    public int Id { get; set; }

    public int IncidentId { get; set; }
    public Incident? Incident { get; set; }

    [Required, MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    public int AuthorUserId { get; set; }
    public User? AuthorUser { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
