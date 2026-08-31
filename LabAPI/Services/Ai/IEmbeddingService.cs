namespace LabAPI.Services.Ai;

// Turns a piece of text into a numeric vector ("embedding") that captures
// its meaning, so we can compare texts by cosine similarity instead of
// exact keyword matching.
public interface IEmbeddingService
{
    Task<float[]> EmbedAsync(string text);
}
