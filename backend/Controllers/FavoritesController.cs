using Microsoft.AspNetCore.Mvc;
using ParkMeBackend.Services;

namespace ParkMeBackend.Controllers;

[ApiController]
[Route("api/favorites")]
public class FavoritesController : ControllerBase
{
    private readonly FavoritesService _favoritesService;

    public FavoritesController(FavoritesService favoritesService)
    {
        _favoritesService = favoritesService;
    }

    // GET /api/favorites/{userId}
    // Returns the list of parkingLotId values the user has favorited.
    [HttpGet("{userId}")]
    public async Task<ActionResult<List<int>>> GetFavorites(string userId)
    {
        var ids = await _favoritesService.GetFavoriteIdsByUserAsync(userId);
        return Ok(ids);
    }

    // POST /api/favorites
    // Body: { "userId": "string", "parkingLotId": 1 }
    [HttpPost]
    public async Task<IActionResult> AddFavorite([FromBody] FavoriteRequest request)
    {
        await _favoritesService.AddFavoriteAsync(request.UserId, request.ParkingLotId);
        return Ok();
    }

    // DELETE /api/favorites
    // Body: { "userId": "string", "parkingLotId": 1 }
    [HttpDelete]
    public async Task<IActionResult> RemoveFavorite([FromBody] FavoriteRequest request)
    {
        await _favoritesService.RemoveFavoriteAsync(request.UserId, request.ParkingLotId);
        return Ok();
    }
}

public record FavoriteRequest(string UserId, int ParkingLotId);
