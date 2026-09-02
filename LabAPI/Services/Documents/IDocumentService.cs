using LabAPI.DTOs;

namespace LabAPI.Services.Documents;

public interface IDocumentService
{
    // Get all uploaded documents
    Task<List<DocumentResponse>> GetAllAsync();

    // Upload and process a document
    //
    // extractedText -> used by AI/RAG
    // fileData      -> original uploaded PDF/TXT
    // contentType   -> application/pdf or text/plain
    Task<DocumentResponse> IngestAsync(
        string title,
        string fileName,
        string extractedText,
        byte[] fileData,
        string contentType,
        int uploadedByUserId);

    // Get the original uploaded file
    // Used by the frontend to display the actual PDF.
    Task<DocumentFileResponse> GetFileAsync(int id);

    // Approve document
    Task<DocumentResponse> ApproveAsync(
        int id,
        int reviewedByUserId);

    // Reject document
    Task<DocumentResponse> RejectAsync(
        int id,
        int reviewedByUserId);

    // Delete document
    Task DeleteAsync(int id);
}


// =========================================================
// ORIGINAL FILE RESPONSE
// =========================================================
//
// This is NOT the same as DocumentResponse.
//
// DocumentResponse is used for the document list.
//
// DocumentFileResponse is used when we actually need
// the original uploaded file.
//

public class DocumentFileResponse
{
    public byte[] FileData { get; set; } = Array.Empty<byte>();

    public string ContentType { get; set; } = "application/octet-stream";

    public string FileName { get; set; } = string.Empty;
}