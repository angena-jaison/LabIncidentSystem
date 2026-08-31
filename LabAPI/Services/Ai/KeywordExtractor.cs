using System.Text.RegularExpressions;

namespace LabAPI.Services.Ai;

// Shared word-extraction logic: lowercases text, strips punctuation, and
// drops short/filler ("stop") words. Used by:
//  - LocalEmbeddingService, to build the embedding vector
//  - RagService, as an extra sanity check on top of the embedding score,
//    so nonsense input can never accidentally look "grounded" just from a
//    hash collision in the simple offline embedding.
public static class KeywordExtractor
{
    private static readonly HashSet<string> StopWords = new(new[]
    {
        "the","a","an","is","are","was","were","of","to","in","on","at","and","or",
        "for","with","this","that","it","as","be","by","from","we","you","i","our",
        "what","how","why","when","where","who","should","would","could","do","does",
        "did","can","will","my","your","me","us"
    });

    public static List<string> ExtractKeywords(string text)
    {
        return Regex.Matches(text.ToLowerInvariant(), @"[a-z0-9]+")
            .Select(m => m.Value)
            .Where(w => w.Length > 2 && !StopWords.Contains(w))
            .ToList();
    }
}