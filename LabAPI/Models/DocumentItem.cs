using System.ComponentModel.DataAnnotations;

namespace LabAPI.Models;

// Metadata about an uploaded knowledge document (e.g. a safety procedure PDF/txt).
public class DocumentItem
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string FileName { get; set; } = string.Empty;

    // We store the extracted plain text so we can chunk + embed it.
    public string FullText { get; set; } = string.Empty;

    public int UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }

    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;

    // --- Approval / governance (Administrator-only workflow) ---
    // The AI assistant (RagService) only ever retrieves chunks belonging to
    // an Approved document. Pending/Rejected documents are stored but
    // invisible to the AI - this is the control that guarantees the
    // assistant only answers from vetted material.
    public DocumentStatus Status { get; set; } = DocumentStatus.Pending;

    public int? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }

    public List<DocumentChunk> Chunks { get; set; } = new();
}
