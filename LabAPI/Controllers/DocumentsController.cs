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

    // GET /api/documents
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var docs = await _documentService.GetAllAsync();
        return Ok(docs);
    }

    // POST /api/documents/upload
    // Reviewers AND Administrators can submit candidate knowledge documents
    // (.txt or .pdf). The document is chunked + embedded and stored
    // permanently immediately on upload - but it only becomes visible to the
    // AI assistant once its Status is Approved (see below).
    [HttpPost("upload")]
    [Authorize(Roles = "Reviewer,Administrator")]
    public async Task<IActionResult> Upload(IFormFile file, [FromForm] string title)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Please choose a .txt or .pdf file to upload." });

        string text;

        if (file.FileName.EndsWith(".txt", StringComparison.OrdinalIgnoreCase))
        {
            using var reader = new StreamReader(file.OpenReadStream());
            text = await reader.ReadToEndAsync();
        }
        else if (file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            text = ExtractTextFromPdf(file);
        }
        else
        {
            return BadRequest(new { message = "Only .txt and .pdf files are supported." });
        }

        var result = await _documentService.IngestAsync(title, file.FileName, text, CurrentUserId);

        // An Administrator IS the approver, so there's no point making them
        // approve their own upload as a separate step - it goes straight to
        // Approved and is immediately usable by the AI assistant.
        // A Reviewer's upload still starts as Pending and needs an
        // Administrator to approve it via PATCH /approve below.
        if (User.IsInRole("Administrator"))
        {
            result = await _documentService.ApproveAsync(result.Id, CurrentUserId);
        }

        return Ok(result);
    }

    // Reads every page of the PDF and concatenates the extracted text.
    // PdfPig is pure managed code (no native dependencies), which keeps
    // deployment simple - it just works wherever .NET runs.
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

    // PATCH /api/documents/5/approve
    [HttpPatch("{id:int}/approve")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Approve(int id)
    {
        var result = await _documentService.ApproveAsync(id, CurrentUserId);
        return Ok(result);
    }

    // PATCH /api/documents/5/reject
    [HttpPatch("{id:int}/reject")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Reject(int id)
    {
        var result = await _documentService.RejectAsync(id, CurrentUserId);
        return Ok(result);
    }

    // DELETE /api/documents/5
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        await _documentService.DeleteAsync(id);
        return NoContent();
    }
}