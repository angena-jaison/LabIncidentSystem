namespace LabAPI.DTOs;

public class DocumentResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public int ChunkCount { get; set; }
    public string UploadedByName { get; set; } = string.Empty;
    public DateTime UploadedAtUtc { get; set; }
    public string Status { get; set; } = string.Empty; // Pending | Approved | Rejected
    public string? ReviewedByName { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
}
public class DocumentViewResponse
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public string FullText { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string UploadedByName { get; set; } = string.Empty;

    public DateTime UploadedAtUtc { get; set; }
}

public class DocumentFileResponse
{
    public byte[] FileData { get; set; } = Array.Empty<byte>();

    public string ContentType { get; set; } = "application/octet-stream";

    public string FileName { get; set; } = string.Empty;
}