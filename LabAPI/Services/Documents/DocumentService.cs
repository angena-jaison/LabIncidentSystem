using LabAPI.Data;
using LabAPI.DTOs;
using LabAPI.Models;
using LabAPI.Services.Ai;
using Microsoft.EntityFrameworkCore;

namespace LabAPI.Services.Documents;

// Handles turning an uploaded document into searchable knowledge:
// text -> chunks -> embeddings -> saved to the database, PENDING approval.
// A document is only usable by the AI assistant once ApproveAsync has been
// called - see RagService, which filters strictly on Status == Approved.
public class DocumentService : IDocumentService
{
    private readonly AppDbContext _db;
    private readonly ITextChunker _chunker;
    private readonly IEmbeddingService _embeddingService;

    public DocumentService(AppDbContext db, ITextChunker chunker, IEmbeddingService embeddingService)
    {
        _db = db;
        _chunker = chunker;
        _embeddingService = embeddingService;
    }

    public async Task<List<DocumentResponse>> GetAllAsync()
    {
        // IMPORTANT: no .Include(d => d.Chunks) here anymore. That was
        // loading every chunk's full text AND embedding vector into memory
        // just to count them - with hundreds of chunks across several
        // documents, that's a lot of unnecessary data transfer, and was
        // exactly why this page felt slow to load. Doing "d.Chunks.Count"
        // INSIDE this Select() instead lets EF Core translate it into a SQL
        // COUNT(*) subquery - the chunk content itself never leaves the
        // database, only the number.
        return await _db.Documents
            .OrderByDescending(d => d.UploadedAtUtc)
            .Select(d => new DocumentResponse
            {
                Id = d.Id,
                Title = d.Title,
                FileName = d.FileName,
                ChunkCount = d.Chunks.Count,
                UploadedByName = d.UploadedByUser!.FullName,
                UploadedAtUtc = d.UploadedAtUtc,
                Status = d.Status.ToString(),
                ReviewedByName = d.ReviewedByUser != null ? d.ReviewedByUser.FullName : null,
                ReviewedAtUtc = d.ReviewedAtUtc
            })
            .ToListAsync();
    }

    public async Task<DocumentResponse> IngestAsync(string title, string fileName, string extractedText, int uploadedByUserId)
    {
        if (string.IsNullOrWhiteSpace(extractedText))
            throw new InvalidOperationException("The document appears to be empty - nothing to learn from.");

        var document = new DocumentItem
        {
            Title = title,
            FileName = fileName,
            FullText = extractedText,
            UploadedByUserId = uploadedByUserId,
            Status = DocumentStatus.Pending // must be approved by an Administrator before the AI can use it
        };

        _db.Documents.Add(document);
        await _db.SaveChangesAsync(); // need the Id before adding chunks

        var pieces = _chunker.Chunk(extractedText);

        for (int i = 0; i < pieces.Count; i++)
        {
            var vector = await _embeddingService.EmbedAsync(pieces[i]);

            _db.DocumentChunks.Add(new DocumentChunk
            {
                DocumentItemId = document.Id,
                ChunkIndex = i,
                Content = pieces[i],
                EmbeddingCsv = VectorMath.ToCsv(vector)
            });
        }

        await _db.SaveChangesAsync();

        return await GetSingleAsync(document.Id);
    }

    public async Task<DocumentResponse> ApproveAsync(int id, int reviewedByUserId)
    {
        var doc = await FindOrThrow(id);
        doc.Status = DocumentStatus.Approved;
        doc.ReviewedByUserId = reviewedByUserId;
        doc.ReviewedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await GetSingleAsync(id);
    }

    public async Task<DocumentResponse> RejectAsync(int id, int reviewedByUserId)
    {
        var doc = await FindOrThrow(id);
        doc.Status = DocumentStatus.Rejected;
        doc.ReviewedByUserId = reviewedByUserId;
        doc.ReviewedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await GetSingleAsync(id);
    }

    public async Task DeleteAsync(int id)
    {
        var doc = await _db.Documents.FindAsync(id);
        if (doc == null) throw new KeyNotFoundException($"Document #{id} was not found.");

        _db.Documents.Remove(doc); // cascades to chunks
        await _db.SaveChangesAsync();
    }

    private async Task<DocumentItem> FindOrThrow(int id)
    {
        var doc = await _db.Documents.FindAsync(id);
        if (doc == null) throw new KeyNotFoundException($"Document #{id} was not found.");
        return doc;
    }

    // Same fix as GetAllAsync: count chunks via SQL, don't load their content.
    private async Task<DocumentResponse> GetSingleAsync(int id)
    {
        return await _db.Documents
            .Where(d => d.Id == id)
            .Select(d => new DocumentResponse
            {
                Id = d.Id,
                Title = d.Title,
                FileName = d.FileName,
                ChunkCount = d.Chunks.Count,
                UploadedByName = d.UploadedByUser!.FullName,
                UploadedAtUtc = d.UploadedAtUtc,
                Status = d.Status.ToString(),
                ReviewedByName = d.ReviewedByUser != null ? d.ReviewedByUser.FullName : null,
                ReviewedAtUtc = d.ReviewedAtUtc
            })
            .FirstAsync();
    }
}