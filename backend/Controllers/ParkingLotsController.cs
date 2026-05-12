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
    // GET /api/parkinglots?sortBy=price
    // GET /api/parkinglots?sortBy=distance&userLat=32.08&userLng=34.78
    //
    // Query parameters:
    //   sortBy  – optional. Supported values: "distance" | "price".
    //             Omitting it returns the default (file) order.
    //             Unknown values → 400 Bad Request.
    //   userLat – user's latitude.  Required when sortBy=distance.
    //   userLng – user's longitude. Required when sortBy=distance.
    //
    // Sorting behaviour:
    //   distance – closest parking lot first, calculated via Haversine formula.
    //              Falls back to default order if userLat/userLng are missing.
    //   price    – cheapest parking lot first (ascending PricePerHour).
    //
    // Invalid sortBy handling:
    //   Returns 400 Bad Request so callers catch typos early rather than silently
    //   getting an unexpected default order.
    [HttpGet]
    public async Task<ActionResult<List<ParkingLot>>> GetAll(
        [FromQuery] string? sortBy = null,
        [FromQuery] double? userLat = null,
        [FromQuery] double? userLng = null)
    {
        // Reject unsupported sortBy values immediately.
        if (sortBy != null && sortBy != "distance" && sortBy != "price")
            return BadRequest($"Invalid sortBy value '{sortBy}'. Supported values: 'distance', 'price'.");

        var parkingLots = await _parkingLotService.GetSortedAsync(sortBy, userLat, userLng);
        return Ok(parkingLots);
    }
}
