namespace LabAPI.Models;

// Optional: keeps a history of what people asked the AI assistant, and which
// chunks were used to answer, for traceability / demo purposes.
public class AiQueryLog
{
    public int Id { get; set; }

    public int AskedByUserId { get; set; }
    public User? AskedByUser { get; set; }

    public string Question { get; set; } = string.Empty;

    public string AnswerText { get; set; } = string.Empty;

    // Comma-separated list of DocumentChunk ids used to ground the answer.
    public string SourceChunkIdsCsv { get; set; } = string.Empty;

    public bool WasGrounded { get; set; } // false if we found no relevant chunks

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
