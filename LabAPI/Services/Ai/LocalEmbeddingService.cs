namespace LabAPI.Services.Ai;

// A free, offline embedding you can run with ZERO API keys and ZERO cost.
// It is a simple "hashed bag-of-words" vector: every meaningful word is
// hashed into one of N buckets and we count how often each bucket appears.
//
// IMPORTANT LIMITATION: on its own, a hash-bucket vector can occasionally
// give a nonsense word a small nonzero similarity to real content, purely
// by coincidence (a hash collision). That's why RagService does NOT trust
// this score alone to decide whether an answer is "grounded" - it also
// requires a real, exact shared keyword (see RagService.HasSharedKeyword).
// This embedding is for ranking similarity; the keyword check is the actual
// grounding gate.
public class LocalEmbeddingService : IEmbeddingService
{
    private const int VectorSize = 256;

    public Task<float[]> EmbedAsync(string text)
    {
        var vector = new float[VectorSize];
        var words = KeywordExtractor.ExtractKeywords(text);

        foreach (var word in words)
        {
            var bucket = Math.Abs(word.GetHashCode()) % VectorSize;
            vector[bucket] += 1f;
        }

        var magnitude = (float)Math.Sqrt(vector.Sum(v => v * v));
        if (magnitude > 0)
            for (int i = 0; i < vector.Length; i++)
                vector[i] /= magnitude;

        return Task.FromResult(vector);
    }
}