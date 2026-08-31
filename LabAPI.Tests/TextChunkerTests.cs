using LabAPI.Services.Ai;
using Xunit;
using FluentAssertions;

namespace LabAPI.Tests;

public class TextChunkerTests
{
    private readonly TextChunker _chunker = new();

    [Fact]
    public void EmptyText_ReturnsNoChunks()
    {
        var result = _chunker.Chunk("");
        result.Should().BeEmpty();
    }

    [Fact]
    public void ShortText_ReturnsOneChunk()
    {
        var result = _chunker.Chunk("This is a short safety note about gloves.");
        result.Should().HaveCount(1);
    }

    [Fact]
    public void LongText_IsSplitIntoMultipleChunks()
    {
        var longText = string.Join(". ", Enumerable.Repeat("Always wear safety goggles in the lab", 60));

        var result = _chunker.Chunk(longText, maxWordsPerChunk: 30, overlapWords: 5);

        result.Count.Should().BeGreaterThan(1);
    }
}
