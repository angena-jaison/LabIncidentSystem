using LabAPI.DTOs;
using LabAPI.Models;

namespace LabAPI.Services.Ai;

public interface IRagService
{
    Task<AskAiResponse> AskAsync(string question, int askedByUserId);
    Task<IncidentSummaryResponse> SummarizeIncidentAsync(Incident incident);
}
