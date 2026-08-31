namespace LabAPI.Services.Ai;

public class LocalTextGenerationService : ITextGenerationService
{
    private const int MaxBullets = 4;
    private const int MaxBulletLength = 140;

    public Task<string> GenerateAnswerAsync(string question, List<string> contextChunks)
    {
        if (contextChunks.Count == 0)
        {
            return Task.FromResult(
                "Out of context - I don't have an approved knowledge-base document that answers this.");
        }

        var bullets = contextChunks
            .Take(MaxBullets)
            .Select(chunk => "- " + TakeFirstSentence(chunk));

        return Task.FromResult(string.Join("\n", bullets));
    }

    public Task<string> GenerateIncidentSummaryAsync(string incidentText, List<string> relatedKnowledgeChunks)
    {
        var summary = "- " + TakeFirstSentence(incidentText);
        return Task.FromResult(summary);
    }

    private static string TakeFirstSentence(string text)
    {
        var sentence = text
            .Split(new[] { ". ", "! ", "? " }, StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault(s => s.Trim().Length > 0)
            ?.Trim() ?? text.Trim();

        if (sentence.Length > MaxBulletLength)
            sentence = sentence[..MaxBulletLength].TrimEnd() + "...";

        if (sentence.Length > 0 && !sentence.EndsWith(".") && !sentence.EndsWith("!") && !sentence.EndsWith("?"))
            sentence += ".";

        return sentence;
    }
}