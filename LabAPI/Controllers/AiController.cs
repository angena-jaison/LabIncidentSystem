using System.Security.Claims;
using LabAPI.Data;
using LabAPI.DTOs;
using LabAPI.Services.Ai;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LabAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IRagService _ragService;
    private readonly AppDbContext _db;

    public AiController(IRagService ragService, AppDbContext db)
    {
        _ragService = ragService;
        _db = db;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // POST /api/ai/ask
    // The main "ask the AI assistant a question" endpoint (RAG over the
    // uploaded knowledge base).
    [HttpPost("ask")]
    public async Task<ActionResult<AskAiResponse>> Ask(AskAiRequest request)
    {
        var result = await _ragService.AskAsync(request.Question, CurrentUserId);
        return Ok(result);
    }

    // GET /api/ai/incidents/5/summary
    // AI-generated incident summary + a suggested next investigative step.
    [HttpGet("incidents/{id:int}/summary")]
    public async Task<ActionResult<IncidentSummaryResponse>> SummarizeIncident(int id)
    {
        var incident = await _db.Incidents.FirstOrDefaultAsync(i => i.Id == id);
        if (incident == null) return NotFound(new { message = $"Incident #{id} was not found." });

        var result = await _ragService.SummarizeIncidentAsync(incident);
        return Ok(result);
    }
}
