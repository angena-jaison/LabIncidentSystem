using LabAPI.Services.Incidents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LabAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IIncidentService _incidentService;

    public DashboardController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    // GET /api/dashboard/counts
    [HttpGet("counts")]
    public async Task<IActionResult> GetCounts()
    {
        var counts = await _incidentService.GetDashboardCountsAsync();
        return Ok(counts);
    }
}
