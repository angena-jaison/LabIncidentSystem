using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace LabAPI.Services.Ai;

// Real generative answers via OpenAI's Chat Completions API.
// The system prompt strictly instructs the model to answer ONLY from the
// supplied context, and to say so plainly if the context is not enough -
// this is what keeps the assistant "grounded" instead of hallucinating.
public class OpenAiTextGenerationService : ITextGenerationService
{
    private readonly HttpClient _http;

    public OpenAiTextGenerationService(HttpClient http, IOptions<AiSettings> settings)
    {
        _http = http;
        _http.BaseAddress = new Uri("https://api.openai.com/v1/");
        _http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", settings.Value.OpenAiApiKey);
    }

    public async Task<string> GenerateAnswerAsync(string question, List<string> contextChunks)
    {
        var context = contextChunks.Count > 0
            ? string.Join("\n---\n", contextChunks)
            : "(no relevant context found)";

       var systemPrompt =
        "You are a laboratory safety assistant. Answer ONLY using the CONTEXT provided. " +
        "Respond ONLY as short bullet points, each starting with '- ', each under 15 words, " +
        "2-4 bullets maximum. No paragraphs, no preamble, no closing remarks. " +
        "If the context does not answer the question, respond with EXACTLY this single line: " +
        "\"Out of context - I don't have an approved knowledge-base document that answers this.\" " +
        "Never invent facts that are not in the context.";

        var userPrompt = $"CONTEXT:\n{context}\n\nQUESTION:\n{question}";

        return await CallChatCompletion(systemPrompt, userPrompt);
    }

    public async Task<string> GenerateIncidentSummaryAsync(string incidentText, List<string> relatedKnowledgeChunks)
    {
        var context = string.Join("\n---\n", relatedKnowledgeChunks);

        var systemPrompt =
            "You summarize a lab incident as exactly TWO short bullet points, each starting with " +
            "'- ', each under 15 words: one summarizing the incident, one suggesting the single " +
            "next investigative step. No paragraphs, no preamble. Use the related knowledge only " +
            "as background - do not present it as fact about THIS incident unless the incident " +
            "text says so.";

        var userPrompt = $"INCIDENT:\n{incidentText}\n\nRELATED KNOWLEDGE:\n{context}";

        return await CallChatCompletion(systemPrompt, userPrompt);
    }

    private async Task<string> CallChatCompletion(string systemPrompt, string userPrompt)
    {
        var response = await _http.PostAsJsonAsync("chat/completions", new
        {
            model = "gpt-4o-mini",
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            temperature = 0.2
        });

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
    }
}
