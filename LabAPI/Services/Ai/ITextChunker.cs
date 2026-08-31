namespace LabAPI.Services.Ai;

public interface ITextChunker
{
    // Splits a long document into small overlapping pieces ("chunks") that
    // are each small enough to embed and to hand to an AI model as context.
    List<string> Chunk(string fullText, int maxWordsPerChunk = 120, int overlapWords = 20);
}
