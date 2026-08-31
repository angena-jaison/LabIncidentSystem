using LabAPI.Data;
using LabAPI.DTOs;
using LabAPI.Models;
using Microsoft.Extensions.Options;

namespace LabAPI.Services.Ai;

public class RagService : IRagService
{
    private readonly AppDbContext _db;
    private readonly IEmbeddingService _embeddingService;
    private readonly ITextGenerationService _generationService;
    private readonly AiSettings _settings;

    public RagService(
        AppDbContext db,
        IEmbeddingService embeddingService,
        ITextGenerationService generationService,
        IOptions<AiSettings> settings)
    {
        _db = db;
        _embeddingService = embeddingService;
        _generationService = generationService;
        _settings = settings.Value;
    }

    public async Task<AskAiResponse> AskAsync(string question, int askedByUserId)
    {
        var groundedChunks = await RetrieveGroundedChunksAsync(question, _settings.TopKChunks);
        var isGrounded = groundedChunks.Count > 0;

        var answerText = await _generationService.GenerateAnswerAsync(
            question, groundedChunks.Select(c => c.Chunk.Content).ToList());

        var response = new AskAiResponse
        {
            Answer = answerText,
            IsGrounded = isGrounded,
            Sources = groundedChunks.Select(c => new AiSourceReference
            {
                DocumentId = c.Chunk.DocumentItemId,
                DocumentTitle = c.Chunk.DocumentItem?.Title ?? "",
                ChunkIndex = c.Chunk.ChunkIndex,
                Snippet = c.Chunk.Content.Length > 220 ? c.Chunk.Content[..220] + "..." : c.Chunk.Content,
                SimilarityScore = Math.Round(c.Score, 3)
            }).ToList()
        };

        _db.AiQueryLogs.Add(new AiQueryLog
        {
            AskedByUserId = askedByUserId,
            Question = question,
            AnswerText = response.Answer,
            SourceChunkIdsCsv = string.Join(',', groundedChunks.Select(c => c.Chunk.Id)),
            WasGrounded = isGrounded
        });
        await _db.SaveChangesAsync();

        return response;
    }

    public async Task<IncidentSummaryResponse> SummarizeIncidentAsync(Incident incident)
    {
        var incidentText = $"{incident.Title}. {incident.Description}. Category: {incident.Category}. " +
                            $"Severity: {incident.Severity}. Equipment: {incident.Equipment}.";

        var groundedChunks = await RetrieveGroundedChunksAsync(incidentText, _settings.TopKChunks);

        var summaryText = await _generationService.GenerateIncidentSummaryAsync(
            incidentText, groundedChunks.Select(c => c.Chunk.Content).ToList());

        var suggestedStep = incident.Severity >= IncidentSeverity.High
            ? "Escalate to the safety officer and quarantine the affected equipment pending investigation."
            : "Assign an investigator and gather equipment logs / maintenance history for the affected item.";

        return new IncidentSummaryResponse
        {
            Summary = summaryText,
            SuggestedNextStep = suggestedStep,
            RelatedKnowledge = groundedChunks.Select(c => new AiSourceReference
            {
                DocumentId = c.Chunk.DocumentItemId,
                DocumentTitle = c.Chunk.DocumentItem?.Title ?? "",
                ChunkIndex = c.Chunk.ChunkIndex,
                Snippet = c.Chunk.Content.Length > 220 ? c.Chunk.Content[..220] + "..." : c.Chunk.Content,
                SimilarityScore = Math.Round(c.Score, 3)
            }).ToList()
        };
    }

    private async Task<List<(DocumentChunk Chunk, double Score)>> RetrieveGroundedChunksAsync(string queryText, int topK)
    {
        var queryKeywords = KeywordExtractor.ExtractKeywords(queryText).ToHashSet();

        var approvedChunks = _db.DocumentChunks
            .Where(c => c.DocumentItem!.Status == DocumentStatus.Approved)
            .ToList();

        var candidates = approvedChunks
            .Where(c => queryKeywords.Overlaps(KeywordExtractor.ExtractKeywords(c.Content)))
            .ToList();

        if (candidates.Count == 0)
            return new List<(DocumentChunk, double)>();

        var queryVector = await _embeddingService.EmbedAsync(queryText);

        var ranked = candidates
            .Select(c => (Chunk: c, Score: VectorMath.CosineSimilarity(queryVector, VectorMath.FromCsv(c.EmbeddingCsv))))
            .OrderByDescending(s => s.Score)
            .Take(topK)
            .ToList();

        var docIds = ranked.Select(t => t.Chunk.DocumentItemId).Distinct().ToList();
        var docs = _db.Documents.Where(d => docIds.Contains(d.Id)).ToDictionary(d => d.Id);

        foreach (var (chunk, _) in ranked)
            chunk.DocumentItem = docs.GetValueOrDefault(chunk.DocumentItemId);

        return ranked;
    }
}