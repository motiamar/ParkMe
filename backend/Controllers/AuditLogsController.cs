using Microsoft.AspNetCore.Mvc;
using ParkMeBackend.Models;
using ParkMeBackend.Services;

namespace ParkMeBackend.Controllers;

[ApiController]
[Route("api/auditlogs")]
public class AuditLogsController : ControllerBase
{
    private readonly AuditLogService _auditLogService;

    public AuditLogsController(AuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    // GET /api/auditlogs
    [HttpGet]
    public async Task<ActionResult<List<AuditLog>>> GetAll()
    {
        var logs = await _auditLogService.GetAllAsync();
        return Ok(logs);
    }

    // POST /api/auditlogs
    // Accepts frontend-originated events: SEARCH_LOCATION, NAVIGATE_TO_PARKING, etc.
    // Body: { "userId": "...", "actionType": "...", "entityType": "...", "entityId": null, "description": "..." }
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AuditLogRequest request)
    {
        await _auditLogService.LogAsync(
            request.UserId,
            request.ActionType,
            request.EntityType,
            request.EntityId,
            request.Description);
        return Ok();
    }
}

public record AuditLogRequest(string UserId, string ActionType, string EntityType, string? EntityId, string? Description);
