using System.Security.Claims;
using LabAPI.DTOs;
using LabAPI.Services.Incidents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LabAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // every endpoint here requires a valid JWT
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/incidents?status=Open&severity=High&search=centrifuge&page=1
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] IncidentQueryParams query)
    {
        var result = await _incidentService.SearchAsync(query);
        return Ok(result);
    }

    // GET /api/incidents/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _incidentService.GetByIdAsync(id);
        return Ok(result);
    }

    // POST /api/incidents
    [HttpPost]
    public async Task<IActionResult> Create(CreateIncidentRequest request)
    {
        var result = await _incidentService.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // PUT /api/incidents/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateIncidentRequest request)
    {
        var result = await _incidentService.UpdateAsync(id, request, CurrentUserId);
        return Ok(result);
    }

    // DELETE /api/incidents/5   (Administrator only)
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        await _incidentService.DeleteAsync(id);
        return NoContent();
    }

    // PATCH /api/incidents/5/status
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Reviewer,Administrator")]
    public async Task<IActionResult> ChangeStatus(int id, ChangeStatusRequest request)
    {
        var result = await _incidentService.ChangeStatusAsync(id, request, CurrentUserId);
        return Ok(result);
    }

    // PATCH /api/incidents/5/assign
    [HttpPatch("{id:int}/assign")]
    [Authorize(Roles = "Reviewer,Administrator")]
    public async Task<IActionResult> Assign(int id, AssignIncidentRequest request)
    {
        var result = await _incidentService.AssignAsync(id, request);
        return Ok(result);
    }

    // PATCH /api/incidents/5/resolve
    [HttpPatch("{id:int}/resolve")]
    [Authorize(Roles = "Reviewer,Administrator")]
    public async Task<IActionResult> Resolve(int id, ResolveIncidentRequest request)
    {
        var result = await _incidentService.ResolveAsync(id, request, CurrentUserId);
        return Ok(result);
    }

    // POST /api/incidents/5/notes
    [HttpPost("{id:int}/notes")]
    public async Task<IActionResult> AddNote(int id, AddNoteRequest request)
    {
        await _incidentService.AddNoteAsync(id, request, CurrentUserId);
        return Ok();
    }

    // POST /api/incidents/5/corrective-actions
    [HttpPost("{id:int}/corrective-actions")]
    public async Task<IActionResult> AddCorrectiveAction(int id, AddCorrectiveActionRequest request)
    {
        await _incidentService.AddCorrectiveActionAsync(id, request, CurrentUserId);
        return Ok();
    }
}
