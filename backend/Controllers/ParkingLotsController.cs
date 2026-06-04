using Microsoft.AspNetCore.Mvc;
using ParkMeBackend.Models;
using ParkMeBackend.Services;

namespace ParkMeBackend.Controllers;

[ApiController]
[Route("api/parkinglots")]
public class ParkingLotsController : ControllerBase
{
    private readonly ParkingLotService _parkingLotService;

    public ParkingLotsController(ParkingLotService parkingLotService)
    {
        _parkingLotService = parkingLotService;
    }

    // GET /api/parkinglots
    // GET /api/parkinglots?sortBy=price&page=1&pageSize=20
    // GET /api/parkinglots?sortBy=distance&userLat=32.08&userLng=34.78&page=2
    //
    // Query parameters:
    //   sortBy   – optional. Supported values: "distance" | "price".
    //   userLat  – user's latitude.  Required when sortBy=distance.
    //   userLng  – user's longitude. Required when sortBy=distance.
    //   page     – 1-based page number (default: 1).
    //   pageSize – items per page, 1–100 (default: 20).
    //
    // Returns PaginatedResult<ParkingLot> with Items, TotalCount, Page, PageSize.
    [HttpGet]
    public async Task<ActionResult<PaginatedResult<ParkingLot>>> GetAll(
        [FromQuery] string? sortBy = null,
        [FromQuery] double? userLat = null,
        [FromQuery] double? userLng = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (sortBy != null && sortBy != "distance" && sortBy != "price")
            return BadRequest($"Invalid sortBy value '{sortBy}'. Supported values: 'distance', 'price'.");

        if (page < 1) page = 1;
        if (pageSize is < 1 or > 100) pageSize = 20;

        var result = await _parkingLotService.GetSortedAsync(sortBy, userLat, userLng, page, pageSize);
        return Ok(result);
    }
}
