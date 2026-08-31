namespace LabAPI.Services.Ai;

// Produces the final natural-language answer, given the user's question and
// the retrieved, relevant chunks of text ("context").
public interface ITextGenerationService
{
    Task<string> GenerateAnswerAsync(string question, List<string> contextChunks);
    Task<string> GenerateIncidentSummaryAsync(string incidentText, List<string> relatedKnowledgeChunks);
}
