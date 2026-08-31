using LabAPI.DTOs;

namespace LabAPI.Services.Documents;

public interface IDocumentService
{
    Task<List<DocumentResponse>> GetAllAsync();
    Task<DocumentResponse> IngestAsync(string title, string fileName, string extractedText, int uploadedByUserId);
    Task<DocumentResponse> ApproveAsync(int id, int reviewedByUserId);
    Task<DocumentResponse> RejectAsync(int id, int reviewedByUserId);
    Task DeleteAsync(int id);
}
