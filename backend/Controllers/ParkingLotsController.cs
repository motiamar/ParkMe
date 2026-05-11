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

    [HttpGet]
    public async Task<ActionResult<List<ParkingLot>>> GetAll()
    {
        var parkingLots = await _parkingLotService.GetAllAsync();
        return Ok(parkingLots);
    }
}
