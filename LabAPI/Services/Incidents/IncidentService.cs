using LabAPI.Common;
using LabAPI.Data;
using LabAPI.DTOs;
using LabAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LabAPI.Services.Incidents;

public class IncidentService : IIncidentService
{
    private readonly AppDbContext _db;

    public IncidentService(AppDbContext db)
    {
        _db = db;
    }

    // ---- READ ----

    public async Task<PagedResult<IncidentResponse>> SearchAsync(IncidentQueryParams q)
    {
        var query = _db.Incidents
            .Include(i => i.CreatedByUser)
            .Include(i => i.AssignedToUser)
            .AsQueryable();

        if (q.Status.HasValue) query = query.Where(i => i.Status == q.Status.Value);
        if (q.Severity.HasValue) query = query.Where(i => i.Severity == q.Severity.Value);
        if (!string.IsNullOrWhiteSpace(q.Category)) query = query.Where(i => i.Category == q.Category);
        if (!string.IsNullOrWhiteSpace(q.Equipment)) query = query.Where(i => i.Equipment != null && i.Equipment.Contains(q.Equipment));
        if (q.FromDate.HasValue) query = query.Where(i => i.OccurredAtUtc >= q.FromDate.Value);
        if (q.ToDate.HasValue) query = query.Where(i => i.OccurredAtUtc <= q.ToDate.Value);
        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(i => i.Title.Contains(q.Search) || i.Description.Contains(q.Search));

        query = q.SortBy switch
        {
            "Title" => q.Descending ? query.OrderByDescending(i => i.Title) : query.OrderBy(i => i.Title),
            "Severity" => q.Descending ? query.OrderByDescending(i => i.Severity) : query.OrderBy(i => i.Severity),
            "Status" => q.Descending ? query.OrderByDescending(i => i.Status) : query.OrderBy(i => i.Status),
            _ => q.Descending ? query.OrderByDescending(i => i.CreatedAtUtc) : query.OrderBy(i => i.CreatedAtUtc),
        };

        var total = await query.CountAsync();

        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, 100);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => ToResponse(i))
            .ToListAsync();

        return new PagedResult<IncidentResponse>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<IncidentResponse> GetByIdAsync(int id)
    {
        var incident = await _db.Incidents
            .Include(i => i.CreatedByUser)
            .Include(i => i.AssignedToUser)
            .Include(i => i.InvestigationNotes).ThenInclude(n => n.AuthorUser)
            .Include(i => i.CorrectiveActions)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (incident == null)
            throw new KeyNotFoundException($"Incident #{id} was not found.");

        return ToResponse(incident);
    }

    // ---- CREATE / UPDATE / DELETE ----

    public async Task<IncidentResponse> CreateAsync(CreateIncidentRequest request, int currentUserId)
    {
        var incident = new Incident
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Severity = request.Severity,
            Equipment = request.Equipment,
            OccurredAtUtc = request.OccurredAtUtc,
            Status = IncidentStatus.Open,
            CreatedByUserId = currentUserId
        };

        _db.Incidents.Add(incident);
        await _db.SaveChangesAsync();

        _db.StatusHistories.Add(new StatusHistory
        {
            IncidentId = incident.Id,
            FromStatus = IncidentStatus.Open,
            ToStatus = IncidentStatus.Open,
            ChangedByUserId = currentUserId,
            Note = "Incident created."
        });
        await _db.SaveChangesAsync();

        return await GetByIdAsync(incident.Id);
    }

    public async Task<IncidentResponse> UpdateAsync(int id, UpdateIncidentRequest request, int currentUserId)
    {
        var incident = await FindOrThrow(id);

        incident.Title = request.Title;
        incident.Description = request.Description;
        incident.Category = request.Category;
        incident.Severity = request.Severity;
        incident.Equipment = request.Equipment;
        incident.OccurredAtUtc = request.OccurredAtUtc;
        incident.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToResponse(incident);
    }

    public async Task DeleteAsync(int id)
    {
        var incident = await FindOrThrow(id);
        _db.Incidents.Remove(incident);
        await _db.SaveChangesAsync();
    }

    // ---- WORKFLOW ----

    // Which status changes are allowed. Keeps the lifecycle honest:
    // Open -> Investigating -> Resolved -> Closed  (plus re-opening a Resolved one)
    private static readonly Dictionary<IncidentStatus, IncidentStatus[]> AllowedTransitions = new()
    {
        [IncidentStatus.Open] = new[] { IncidentStatus.Investigating },
        [IncidentStatus.Investigating] = new[] { IncidentStatus.Resolved, IncidentStatus.Open },
        [IncidentStatus.Resolved] = new[] { IncidentStatus.Closed, IncidentStatus.Investigating },
        [IncidentStatus.Closed] = Array.Empty<IncidentStatus>()
    };

    public async Task<IncidentResponse> ChangeStatusAsync(int id, ChangeStatusRequest request, int currentUserId)
    {
        var incident = await FindOrThrow(id);

        if (incident.Status == request.NewStatus)
            throw new InvalidOperationException("Incident is already in that status.");

        if (!AllowedTransitions[incident.Status].Contains(request.NewStatus))
            throw new InvalidOperationException(
                $"Cannot move an incident from '{incident.Status}' to '{request.NewStatus}'.");

        var oldStatus = incident.Status;
        incident.Status = request.NewStatus;
        incident.UpdatedAtUtc = DateTime.UtcNow;

        _db.StatusHistories.Add(new StatusHistory
        {
            IncidentId = incident.Id,
            FromStatus = oldStatus,
            ToStatus = request.NewStatus,
            ChangedByUserId = currentUserId,
            Note = request.Note
        });

        await _db.SaveChangesAsync();
        return ToResponse(incident);
    }

    public async Task<IncidentResponse> AssignAsync(int id, AssignIncidentRequest request)
    {
        var incident = await FindOrThrow(id);

        var userExists = await _db.Users.AnyAsync(u => u.Id == request.AssignedToUserId);
        if (!userExists) throw new InvalidOperationException("The user to assign to was not found.");

        incident.AssignedToUserId = request.AssignedToUserId;
        incident.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToResponse(incident);
    }

    public async Task<IncidentResponse> ResolveAsync(int id, ResolveIncidentRequest request, int currentUserId)
    {
        var incident = await FindOrThrow(id);

        if (incident.Status != IncidentStatus.Investigating)
            throw new InvalidOperationException("Only an incident that is 'Investigating' can be resolved.");

        incident.ResolutionDetails = request.ResolutionDetails;
        incident.Status = IncidentStatus.Resolved;
        incident.UpdatedAtUtc = DateTime.UtcNow;

        _db.StatusHistories.Add(new StatusHistory
        {
            IncidentId = incident.Id,
            FromStatus = IncidentStatus.Investigating,
            ToStatus = IncidentStatus.Resolved,
            ChangedByUserId = currentUserId,
            Note = "Marked resolved."
        });

        await _db.SaveChangesAsync();
        return ToResponse(incident);
    }

    public async Task AddNoteAsync(int id, AddNoteRequest request, int currentUserId)
    {
        var incident = await FindOrThrow(id);

        _db.InvestigationNotes.Add(new InvestigationNote
        {
            IncidentId = incident.Id,
            Content = request.Content,
            AuthorUserId = currentUserId
        });

        await _db.SaveChangesAsync();
    }

    public async Task AddCorrectiveActionAsync(int id, AddCorrectiveActionRequest request, int currentUserId)
    {
        var incident = await FindOrThrow(id);

        _db.CorrectiveActions.Add(new CorrectiveAction
        {
            IncidentId = incident.Id,
            Description = request.Description,
            DueDateUtc = request.DueDateUtc,
            CreatedByUserId = currentUserId
        });

        await _db.SaveChangesAsync();
    }

    // ---- DASHBOARD ----

    public async Task<Dictionary<string, int>> GetDashboardCountsAsync()
    {
        var counts = await _db.Incidents
            .GroupBy(i => i.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var result = Enum.GetValues<IncidentStatus>()
            .ToDictionary(s => s.ToString(), s => 0);

        foreach (var c in counts)
            result[c.Status.ToString()] = c.Count;

        result["Total"] = await _db.Incidents.CountAsync();

        return result;
    }

    // ---- helpers ----

    private async Task<Incident> FindOrThrow(int id)
    {
        var incident = await _db.Incidents
            .Include(i => i.CreatedByUser)
            .Include(i => i.AssignedToUser)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (incident == null)
            throw new KeyNotFoundException($"Incident #{id} was not found.");

        return incident;
    }

    private static IncidentResponse ToResponse(Incident i) => new()
    {
        Id = i.Id,
        Title = i.Title,
        Description = i.Description,
        Category = i.Category,
        Severity = i.Severity.ToString(),
        Status = i.Status.ToString(),
        Equipment = i.Equipment,
        OccurredAtUtc = i.OccurredAtUtc,
        CreatedByName = i.CreatedByUser?.FullName ?? "Unknown",
        AssignedToName = i.AssignedToUser?.FullName,
        CreatedAtUtc = i.CreatedAtUtc,
        UpdatedAtUtc = i.UpdatedAtUtc,
        ResolutionDetails = i.ResolutionDetails,
        InvestigationNotes = i.InvestigationNotes
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => new NoteResponse
            {
                Id = n.Id,
                Content = n.Content,
                AuthorName = n.AuthorUser?.FullName ?? "Unknown",
                CreatedAtUtc = n.CreatedAtUtc
            }).ToList(),
        CorrectiveActions = i.CorrectiveActions
            .OrderByDescending(c => c.CreatedAtUtc)
            .Select(c => new CorrectiveActionResponse
            {
                Id = c.Id,
                Description = c.Description,
                IsCompleted = c.IsCompleted,
                DueDateUtc = c.DueDateUtc
            }).ToList()
    };
}
