using System.Text;

namespace LabAPI.Services.Ai;

// A deliberately simple chunker: split into sentences, then group sentences
// together until we hit the word limit. Overlap keeps context from being cut
// awkwardly in half between two chunks.
public class TextChunker : ITextChunker
{
    public List<string> Chunk(string fullText, int maxWordsPerChunk = 120, int overlapWords = 20)
    {
        var chunks = new List<string>();
        if (string.IsNullOrWhiteSpace(fullText)) return chunks;

        var sentences = fullText
            .Replace("\r\n", " ")
            .Replace("\n", " ")
            .Split(new[] { ". ", "! ", "? " }, StringSplitOptions.RemoveEmptyEntries);

        var currentWords = new List<string>();

        foreach (var sentence in sentences)
        {
            var words = sentence.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            currentWords.AddRange(words);

            if (currentWords.Count >= maxWordsPerChunk)
            {
                chunks.Add(string.Join(' ', currentWords));

                // keep the last N words as overlap so the next chunk has context
                currentWords = currentWords
                    .Skip(Math.Max(0, currentWords.Count - overlapWords))
                    .ToList();
            }
        }

        if (currentWords.Count > 0)
            chunks.Add(string.Join(' ', currentWords));

        return chunks;
    }
}
