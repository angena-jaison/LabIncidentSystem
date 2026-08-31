using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace LabAPI.Services.Ai;

public class AiSettings
{
    public string EmbeddingProvider { get; set; } = "Local"; // "Local" or "OpenAI"
    public string OpenAiApiKey { get; set; } = string.Empty;
    public string OpenAiEmbeddingModel { get; set; } = "text-embedding-3-small";
    public int TopKChunks { get; set; } = 4;
}

// Real semantic embeddings via OpenAI's API. Only used when
// Ai:EmbeddingProvider = "OpenAI" and an API key is configured.
// Swap this for Azure OpenAI / another provider by writing another
// IEmbeddingService implementation - nothing else in the app needs to change.
public class OpenAiEmbeddingService : IEmbeddingService
{
    private readonly HttpClient _http;
    private readonly AiSettings _settings;

    public OpenAiEmbeddingService(HttpClient http, IOptions<AiSettings> settings)
    {
        _http = http;
        _settings = settings.Value;
        _http.BaseAddress = new Uri("https://api.openai.com/v1/");
        _http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settings.OpenAiApiKey);
    }

    public async Task<float[]> EmbedAsync(string text)
    {
        var response = await _http.PostAsJsonAsync("embeddings", new
        {
            model = _settings.OpenAiEmbeddingModel,
            input = text
        });

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var vectorJson = json.GetProperty("data")[0].GetProperty("embedding");

        return vectorJson.EnumerateArray().Select(v => v.GetSingle()).ToArray();
    }
}
