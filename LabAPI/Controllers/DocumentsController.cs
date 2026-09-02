using System.Security.Claims;
using System.Text;
using LabAPI.Services.Documents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UglyToad.PdfPig;

namespace LabAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);


    // =========================================================
    // GET ALL DOCUMENTS
    // =========================================================

    // GET /api/documents
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var docs = await _documentService.GetAllAsync();

        return Ok(docs);
    }


    // =========================================================
    // VIEW ORIGINAL UPLOADED FILE
    // =========================================================

    // GET /api/documents/5/file
    //
    // Returns the ORIGINAL uploaded file.
    //
    // For a PDF, the browser receives:
    //
    // Content-Type: application/pdf
    //
    // This allows the browser/frontend to display the
    // actual PDF with its original:
    //
    // - pages
    // - formatting
    // - images
    // - tables
    // - fonts
    // - colors
    //
    [HttpGet("{id:int}/file")]
    public async Task<IActionResult> GetFile(int id)
    {
        var document = await _documentService.GetFileAsync(id);

        // Do NOT provide a download filename here.
        //
        // This allows the browser to display the PDF
        // directly instead of forcing a download.
        return File(
            document.FileData,
            document.ContentType
        );
    }


    // =========================================================
    // UPLOAD DOCUMENT
    // =========================================================

    // POST /api/documents/upload
    //
    // Reviewers and Administrators can upload:
    //
    // - .pdf
    // - .txt
    //
    [HttpPost("upload")]
    [Authorize(Roles = "Reviewer,Administrator")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromForm] string title)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "Please choose a .txt or .pdf file to upload."
            });
        }


        string text;


        // =====================================================
        // TXT FILE
        // =====================================================

        if (file.FileName.EndsWith(
            ".txt",
            StringComparison.OrdinalIgnoreCase))
        {
            using var reader =
                new StreamReader(file.OpenReadStream());

            text = await reader.ReadToEndAsync();
        }


        // =====================================================
        // PDF FILE
        // =====================================================

        else if (file.FileName.EndsWith(
            ".pdf",
            StringComparison.OrdinalIgnoreCase))
        {
            text = ExtractTextFromPdf(file);
        }


        // =====================================================
        // UNSUPPORTED FILE
        // =====================================================

        else
        {
            return BadRequest(new
            {
                message = "Only .txt and .pdf files are supported."
            });
        }


        // =====================================================
        // READ ORIGINAL FILE
        // =====================================================
        //
        // We need BOTH:
        //
        // 1. extracted text
        //    -> used by AI/RAG
        //
        // 2. original file bytes
        //    -> used when displaying the actual document
        //

        byte[] fileData;

        using (var memoryStream = new MemoryStream())
        {
            await file.CopyToAsync(memoryStream);

            fileData = memoryStream.ToArray();
        }


        // =====================================================
        // GET CONTENT TYPE
        // =====================================================

        var contentType = file.ContentType;

        // If the browser/client doesn't provide a content type,
        // determine it from the file extension.
        if (string.IsNullOrWhiteSpace(contentType))
        {
            contentType =
                file.FileName.EndsWith(
                    ".pdf",
                    StringComparison.OrdinalIgnoreCase)
                    ? "application/pdf"
                    : "text/plain";
        }


        // =====================================================
        // SAVE DOCUMENT
        // =====================================================

        var result = await _documentService.IngestAsync(
            title,
            file.FileName,
            text,
            fileData,
            contentType,
            CurrentUserId);


        // =====================================================
        // ADMINISTRATOR AUTO-APPROVAL
        // =====================================================

        // Administrator uploads are automatically approved.
        //
        // Reviewer uploads remain Pending and require
        // Administrator approval.

        if (User.IsInRole("Administrator"))
        {
            result = await _documentService.ApproveAsync(
                result.Id,
                CurrentUserId);
        }


        return Ok(result);
    }


    // =========================================================
    // EXTRACT TEXT FROM PDF
    // =========================================================

    // This is used ONLY for the AI/RAG system.
    //
    // It does NOT replace the original PDF.
    //
    private static string ExtractTextFromPdf(IFormFile file)
    {
        using var stream = file.OpenReadStream();

        using var pdf = PdfDocument.Open(stream);

        var sb = new StringBuilder();

        foreach (var page in pdf.GetPages())
        {
            sb.AppendLine(page.Text);
        }

        return sb.ToString();
    }


    // =========================================================
    // APPROVE DOCUMENT
    // =========================================================

    // PATCH /api/documents/5/approve
    //
    // Administrator only.

    [HttpPatch("{id:int}/approve")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Approve(int id)
    {
        var result = await _documentService.ApproveAsync(
            id,
            CurrentUserId);

        return Ok(result);
    }


    // =========================================================
    // REJECT DOCUMENT
    // =========================================================

    // PATCH /api/documents/5/reject
    //
    // Administrator only.

    [HttpPatch("{id:int}/reject")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Reject(int id)
    {
        var result = await _documentService.RejectAsync(
            id,
            CurrentUserId);

        return Ok(result);
    }


    // =========================================================
    // DELETE DOCUMENT
    // =========================================================

    // DELETE /api/documents/5
    //
    // Administrator only.

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        await _documentService.DeleteAsync(id);

        return NoContent();
    }
}