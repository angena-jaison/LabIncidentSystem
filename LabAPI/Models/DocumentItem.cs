using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LabAPI.Models;

// Metadata and original file data for an uploaded knowledge document.
public class DocumentItem
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(300)]
    public string FileName { get; set; } = string.Empty;

    // The original uploaded file.
    // This allows the frontend to display the actual PDF,
    // preserving its original formatting, pages, images, tables, etc.
    [Column(TypeName = "varbinary(max)")]
    public byte[]? FileData { get; set; }

    // MIME type of the original file.
    // Example:
    // application/pdf
    // text/plain
    public string? ContentType { get; set; }

    // Extracted plain text.
    // This is still required by the AI/RAG system for:
    // text -> chunks -> embeddings.
    public string FullText { get; set; } = string.Empty;

    public int UploadedByUserId { get; set; }
    public User? UploadedByUser { get; set; }

    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;

    // --- Approval / governance ---
    // The AI assistant only retrieves chunks belonging to
    // Approved documents.
    public DocumentStatus Status { get; set; } = DocumentStatus.Pending;

    public int? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }

    public DateTime? ReviewedAtUtc { get; set; }

    public List<DocumentChunk> Chunks { get; set; } = new();
}