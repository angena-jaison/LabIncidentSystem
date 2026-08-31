using System.ComponentModel.DataAnnotations;

namespace LabAPI.DTOs;

public class AskAiRequest
{
    [Required, MaxLength(1000)]
    public string Question { get; set; } = string.Empty;
}

public class AiSourceReference
{
    public int DocumentId { get; set; }
    public string DocumentTitle { get; set; } = string.Empty;
    public int ChunkIndex { get; set; }
    public string Snippet { get; set; } = string.Empty;
    public double SimilarityScore { get; set; }
}

public class AskAiResponse
{
    public string Answer { get; set; } = string.Empty;
    public bool IsGrounded { get; set; } // false => "I don't have enough information"
    public List<AiSourceReference> Sources { get; set; } = new();
}

public class IncidentSummaryResponse
{
    public string Summary { get; set; } = string.Empty;
    public string SuggestedNextStep { get; set; } = string.Empty;
    public List<AiSourceReference> RelatedKnowledge { get; set; } = new();
}
