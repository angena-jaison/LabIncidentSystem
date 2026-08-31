using LabAPI.Common;
using LabAPI.DTOs;
using LabAPI.Models;

namespace LabAPI.Services.Incidents;

public interface IIncidentService
{
    Task<PagedResult<IncidentResponse>> SearchAsync(IncidentQueryParams query);
    Task<IncidentResponse> GetByIdAsync(int id);
    Task<IncidentResponse> CreateAsync(CreateIncidentRequest request, int currentUserId);
    Task<IncidentResponse> UpdateAsync(int id, UpdateIncidentRequest request, int currentUserId);
    Task DeleteAsync(int id);

    Task<IncidentResponse> ChangeStatusAsync(int id, ChangeStatusRequest request, int currentUserId);
    Task<IncidentResponse> AssignAsync(int id, AssignIncidentRequest request);
    Task<IncidentResponse> ResolveAsync(int id, ResolveIncidentRequest request, int currentUserId);

    Task AddNoteAsync(int id, AddNoteRequest request, int currentUserId);
    Task AddCorrectiveActionAsync(int id, AddCorrectiveActionRequest request, int currentUserId);

    Task<Dictionary<string, int>> GetDashboardCountsAsync();
}
