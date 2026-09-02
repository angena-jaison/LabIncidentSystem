using LabAPI.Data;
using LabAPI.DTOs;
using LabAPI.Models;
using LabAPI.Services.Ai;
using Microsoft.EntityFrameworkCore;

namespace LabAPI.Services.Documents;

// Handles turning an uploaded document into searchable knowledge:
//
// Original file + extracted text
//          ↓
//       chunks
//          ↓
//      embeddings
//          ↓
//       database
//
// The original file is stored in FileData so that the frontend can
// display the actual PDF with its original formatting.
//
// The extracted text is stored in FullText because the AI/RAG system
// uses it for chunking and embeddings.
public class DocumentService : IDocumentService
{
    private readonly AppDbContext _db;
    private readonly ITextChunker _chunker;
    private readonly IEmbeddingService _embeddingService;

    public DocumentService(
        AppDbContext db,
        ITextChunker chunker,
        IEmbeddingService embeddingService)
    {
        _db = db;
        _chunker = chunker;
        _embeddingService = embeddingService;
    }


    // =========================================================
    // GET ALL DOCUMENTS
    // =========================================================

    public async Task<List<DocumentResponse>> GetAllAsync()
    {
        // IMPORTANT:
        // Do not load DocumentChunks here.
        //
        // d.Chunks.Count is translated by EF Core into a SQL
        // COUNT query, so we don't load the actual chunk contents
        // and embeddings into memory.

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

                ReviewedByName = d.ReviewedByUser != null
                    ? d.ReviewedByUser.FullName
                    : null,

                ReviewedAtUtc = d.ReviewedAtUtc
            })
            .ToListAsync();
    }


    // =========================================================
    // GET ORIGINAL FILE
    // =========================================================
    //
    // This retrieves the ORIGINAL uploaded PDF/TXT file.
    //
    // For example:
    //
    // PDF
    // FileData      -> original PDF bytes
    // ContentType   -> application/pdf
    // FileName      -> safety-procedure.pdf
    //
    // The controller sends these bytes to the browser.
    //
    // This allows the browser to display the actual PDF instead
    // of displaying extracted/copy-pasted text.
    //

    public async Task<DocumentFileResponse> GetFileAsync(int id)
    {
        var document = await _db.Documents
            .Where(d => d.Id == id)
            .Select(d => new DocumentFileResponse
            {
                FileData = d.FileData!,
                ContentType = d.ContentType
                    ?? "application/octet-stream",
                FileName = d.FileName
            })
            .FirstOrDefaultAsync();


        // Document doesn't exist
        if (document == null)
        {
            throw new KeyNotFoundException(
                $"Document #{id} was not found.");
        }


        // Document exists, but the original file wasn't stored.
        //
        // This can happen with documents that were uploaded before
        // we added FileData to DocumentItem.

        if (document.FileData == null ||
            document.FileData.Length == 0)
        {
            throw new InvalidOperationException(
                "The original file is not available for this document.");
        }


        return document;
    }


    // =========================================================
    // UPLOAD / INGEST DOCUMENT
    // =========================================================
    //
    // fileData      = ORIGINAL uploaded PDF/TXT
    //
    // contentType   = MIME type
    //                  application/pdf
    //                  text/plain
    //
    // extractedText = text extracted from the document.
    //                 This is used by the AI/RAG system.
    //

    public async Task<DocumentResponse> IngestAsync(
        string title,
        string fileName,
        string extractedText,
        byte[] fileData,
        string contentType,
        int uploadedByUserId)
    {
        // Make sure extracted text exists.
        if (string.IsNullOrWhiteSpace(extractedText))
        {
            throw new InvalidOperationException(
                "The document appears to be empty - nothing to learn from.");
        }


        // Make sure original file exists.
        if (fileData == null ||
            fileData.Length == 0)
        {
            throw new InvalidOperationException(
                "The uploaded file is empty.");
        }


        var document = new DocumentItem
        {
            Title = title,

            FileName = fileName,


            // -------------------------------------------------
            // ORIGINAL FILE
            // -------------------------------------------------

            // Store the actual uploaded PDF/TXT.
            //
            // This is what we will later send to the browser
            // for viewing.

            FileData = fileData,


            // -------------------------------------------------
            // CONTENT TYPE
            // -------------------------------------------------

            // Example:
            //
            // PDF -> application/pdf
            // TXT -> text/plain

            ContentType = contentType,


            // -------------------------------------------------
            // EXTRACTED TEXT
            // -------------------------------------------------

            // Keep the extracted text because the AI/RAG system
            // needs it for chunking and embeddings.

            FullText = extractedText,


            // -------------------------------------------------
            // UPLOADER
            // -------------------------------------------------

            UploadedByUserId = uploadedByUserId,


            // -------------------------------------------------
            // APPROVAL STATUS
            // -------------------------------------------------

            // Reviewer uploads start as Pending.
            //
            // Administrator uploads are automatically approved
            // by DocumentsController.

            Status = DocumentStatus.Pending
        };


        _db.Documents.Add(document);


        // Save first so the document receives its database ID.
        await _db.SaveChangesAsync();


        // =====================================================
        // CHUNK THE EXTRACTED TEXT
        // =====================================================

        var pieces = _chunker.Chunk(extractedText);


        // =====================================================
        // CREATE EMBEDDINGS
        // =====================================================

        for (int i = 0; i < pieces.Count; i++)
        {
            var vector =
                await _embeddingService.EmbedAsync(pieces[i]);


            _db.DocumentChunks.Add(new DocumentChunk
            {
                DocumentItemId = document.Id,

                ChunkIndex = i,

                Content = pieces[i],

                EmbeddingCsv =
                    VectorMath.ToCsv(vector)
            });
        }


        // Save all chunks and embeddings.
        await _db.SaveChangesAsync();


        return await GetSingleAsync(document.Id);
    }


    // =========================================================
    // APPROVE DOCUMENT
    // =========================================================

    public async Task<DocumentResponse> ApproveAsync(
        int id,
        int reviewedByUserId)
    {
        var doc = await FindOrThrow(id);


        doc.Status = DocumentStatus.Approved;

        doc.ReviewedByUserId = reviewedByUserId;

        doc.ReviewedAtUtc = DateTime.UtcNow;


        await _db.SaveChangesAsync();


        return await GetSingleAsync(id);
    }


    // =========================================================
    // REJECT DOCUMENT
    // =========================================================

    public async Task<DocumentResponse> RejectAsync(
        int id,
        int reviewedByUserId)
    {
        var doc = await FindOrThrow(id);


        doc.Status = DocumentStatus.Rejected;

        doc.ReviewedByUserId = reviewedByUserId;

        doc.ReviewedAtUtc = DateTime.UtcNow;


        await _db.SaveChangesAsync();


        return await GetSingleAsync(id);
    }


    // =========================================================
    // DELETE DOCUMENT
    // =========================================================

    public async Task DeleteAsync(int id)
    {
        var doc = await _db.Documents.FindAsync(id);


        if (doc == null)
        {
            throw new KeyNotFoundException(
                $"Document #{id} was not found.");
        }


        // Because AppDbContext configures:
        //
        // DocumentItem -> DocumentChunks
        //
        // with DeleteBehavior.Cascade,
        // deleting the document will also delete its chunks.

        _db.Documents.Remove(doc);


        await _db.SaveChangesAsync();
    }


    // =========================================================
    // TEXT-BASED VIEW
    // =========================================================
    //
    // Kept as a fallback / existing functionality.
    //
    // The new PDF viewer should use GetFileAsync() instead.
    //

    public async Task<DocumentViewResponse> GetForViewAsync(int id)
    {
        var document = await _db.Documents
            .Where(d => d.Id == id)
            .Select(d => new DocumentViewResponse
            {
                Id = d.Id,

                Title = d.Title,

                FileName = d.FileName,

                FullText = d.FullText,

                Status = d.Status.ToString(),

                UploadedByName =
                    d.UploadedByUser!.FullName,

                UploadedAtUtc =
                    d.UploadedAtUtc
            })
            .FirstOrDefaultAsync();


        if (document == null)
        {
            throw new KeyNotFoundException(
                $"Document #{id} was not found.");
        }


        return document;
    }


    // =========================================================
    // FIND DOCUMENT
    // =========================================================

    private async Task<DocumentItem> FindOrThrow(int id)
    {
        var doc = await _db.Documents.FindAsync(id);


        if (doc == null)
        {
            throw new KeyNotFoundException(
                $"Document #{id} was not found.");
        }


        return doc;
    }


    // =========================================================
    // GET SINGLE DOCUMENT RESPONSE
    // =========================================================
    //
    // Used after:
    //
    // - Upload
    // - Approve
    // - Reject
    //
    // We only count chunks instead of loading their content.

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

                UploadedByName =
                    d.UploadedByUser!.FullName,

                UploadedAtUtc =
                    d.UploadedAtUtc,

                Status =
                    d.Status.ToString(),

                ReviewedByName =
                    d.ReviewedByUser != null
                        ? d.ReviewedByUser.FullName
                        : null,

                ReviewedAtUtc =
                    d.ReviewedAtUtc
            })
            .FirstAsync();
    }
}