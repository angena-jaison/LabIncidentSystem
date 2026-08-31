using System.ComponentModel.DataAnnotations;
using LabAPI.Models;

namespace LabAPI.DTOs;

public class CreateIncidentRequest
{
    [Required, MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    public IncidentSeverity Severity { get; set; }

    [MaxLength(150)]
    public string? Equipment { get; set; }

    [Required]
    public DateTime OccurredAtUtc { get; set; }
}

public class UpdateIncidentRequest
{
    [Required, MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Required]
    public IncidentSeverity Severity { get; set; }

    [MaxLength(150)]
    public string? Equipment { get; set; }

    [Required]
    public DateTime OccurredAtUtc { get; set; }
}

public class ChangeStatusRequest
{
    [Required]
    public IncidentStatus NewStatus { get; set; }

    public string? Note { get; set; }
}

public class AssignIncidentRequest
{
    [Required]
    public int AssignedToUserId { get; set; }
}

public class AddNoteRequest
{
    [Required, MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
}

public class AddCorrectiveActionRequest
{
    [Required, MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public DateTime? DueDateUtc { get; set; }
}

public class ResolveIncidentRequest
{
    [Required, MaxLength(4000)]
    public string ResolutionDetails { get; set; } = string.Empty;
}

// What we send back to the frontend for a single incident.
public class IncidentResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Equipment { get; set; }
    public DateTime OccurredAtUtc { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public string? AssignedToName { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public string? ResolutionDetails { get; set; }
    public List<NoteResponse> InvestigationNotes { get; set; } = new();
    public List<CorrectiveActionResponse> CorrectiveActions { get; set; } = new();
}

public class NoteResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class CorrectiveActionResponse
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? DueDateUtc { get; set; }
}

// Query parameters for GET /api/incidents (search/filter/sort/paging)
public class IncidentQueryParams
{
    public IncidentStatus? Status { get; set; }
    public IncidentSeverity? Severity { get; set; }
    public string? Category { get; set; }
    public string? Equipment { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Search { get; set; } // matches title/description
    public string SortBy { get; set; } = "CreatedAtUtc"; // Title | Severity | Status | CreatedAtUtc
    public bool Descending { get; set; } = true;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
