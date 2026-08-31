namespace LabAPI.Models;

// A document is split into small chunks (a few sentences each).
// Each chunk gets its own embedding vector so we can search by meaning.
public class DocumentChunk
{
    public int Id { get; set; }

    public int DocumentItemId { get; set; }
    public DocumentItem? DocumentItem { get; set; }

    public int ChunkIndex { get; set; }

    public string Content { get; set; } = string.Empty;

    // Stored as a comma-separated string of floats for simplicity (SQL Server
    // has no native vector type at the time this was written).
    public string EmbeddingCsv { get; set; } = string.Empty;
}
