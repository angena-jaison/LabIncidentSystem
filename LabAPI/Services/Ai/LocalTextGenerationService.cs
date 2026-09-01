namespace LabAPI.Services.Ai;

public class LocalTextGenerationService : ITextGenerationService
{
    private const int MaxBullets = 5;
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
            .SelectMany(chunk => ExtractBulletPoints(chunk))
            .Take(MaxBullets);

        return Task.FromResult(string.Join("\n", bullets));
    }

    public Task<string> GenerateIncidentSummaryAsync(
        string incidentText,
        List<string> relatedKnowledgeChunks)
    {
        var summary = "- " + TakeFirstSentence(incidentText);

        return Task.FromResult(summary);
    }

    private static IEnumerable<string> ExtractBulletPoints(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            yield break;

        // Normalize different bullet separators.
        text = text.Replace("\r\n", "\n")
                   .Replace("\r", "\n");

        // Some uploaded documents contain bullets such as:
        // "...text.•Collect..."
        // "...text. • Collect..."
        // Convert those bullet symbols into real line breaks.
        text = text.Replace("•", "\n");

        var lines = text
            .Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => line.Length > 0);

        foreach (var line in lines)
        {
            var cleaned = line
                .TrimStart('-', '*', '•')
                .Trim();

            if (cleaned.Length == 0)
                continue;

            // If a line contains several sentences, use the first one.
            var sentence = TakeFirstSentence(cleaned);

            if (!string.IsNullOrWhiteSpace(sentence))
                yield return "- " + sentence;
        }
    }

    private static string TakeFirstSentence(string text)
    {
        var sentence = text
            .Split(
                new[] { ". ", "! ", "? ", ".\n", "!\n", "?\n" },
                StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault(s => s.Trim().Length > 0)
            ?.Trim() ?? text.Trim();

        if (sentence.Length > MaxBulletLength)
            sentence = sentence[..MaxBulletLength].TrimEnd() + "...";

        if (sentence.Length > 0 &&
            !sentence.EndsWith(".") &&
            !sentence.EndsWith("!") &&
            !sentence.EndsWith("?"))
        {
            sentence += ".";
        }

        return sentence;
    }
}