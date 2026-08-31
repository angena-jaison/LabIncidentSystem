using LabAPI.Services.Ai;
using Xunit;
using FluentAssertions;

namespace LabAPI.Tests;

public class VectorMathTests
{
    [Fact]
    public void IdenticalVectors_HaveSimilarityOfOne()
    {
        var a = new float[] { 1, 0, 0 };
        var b = new float[] { 1, 0, 0 };

        var score = VectorMath.CosineSimilarity(a, b);

        score.Should().BeApproximately(1.0, 0.0001);
    }

    [Fact]
    public void OrthogonalVectors_HaveSimilarityOfZero()
    {
        var a = new float[] { 1, 0 };
        var b = new float[] { 0, 1 };

        var score = VectorMath.CosineSimilarity(a, b);

        score.Should().BeApproximately(0.0, 0.0001);
    }

    [Fact]
    public void CsvRoundTrip_PreservesValues()
    {
        var original = new float[] { 0.5f, -0.25f, 1.75f };

        var csv = VectorMath.ToCsv(original);
        var parsed = VectorMath.FromCsv(csv);

        parsed.Should().BeEquivalentTo(original);
    }
}
