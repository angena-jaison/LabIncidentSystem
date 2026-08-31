namespace LabAPI.Services.Ai;

// Small helper for turning embedding vectors into a similarity score.
public static class VectorMath
{
    public static string ToCsv(float[] vector) => string.Join(',', vector);

    public static float[] FromCsv(string csv)
    {
        if (string.IsNullOrWhiteSpace(csv)) return Array.Empty<float>();
        return csv.Split(',').Select(float.Parse).ToArray();
    }

    // Cosine similarity: 1.0 = identical meaning, 0 = unrelated, -1 = opposite.
    public static double CosineSimilarity(float[] a, float[] b)
    {
        if (a.Length == 0 || b.Length == 0 || a.Length != b.Length) return 0;

        double dot = 0, magA = 0, magB = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }

        if (magA == 0 || magB == 0) return 0;
        return dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }
}
