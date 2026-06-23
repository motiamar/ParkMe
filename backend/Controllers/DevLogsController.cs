using Microsoft.AspNetCore.Mvc;
using ParkMeBackend.Models;
using ParkMeBackend.Services;

namespace ParkMeBackend.Controllers;

[ApiController]
[Route("api/devlogs")]
public class DevLogsController : ControllerBase
{
    private readonly DevLogStore _devLogStore;

    public DevLogsController(DevLogStore devLogStore)
    {
        _devLogStore = devLogStore;
    }

    // GET /api/devlogs
    // Returns the most recent technical API logs stored in memory.
    [HttpGet]
    public ActionResult<List<DevLogEntry>> GetRecentLogs()
    {
        var logs = _devLogStore.GetRecentLogs();
        return Ok(logs);
    }
}