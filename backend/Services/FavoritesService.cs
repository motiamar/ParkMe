using Microsoft.EntityFrameworkCore;
using ParkMeBackend.Data;
using ParkMeBackend.Models;

namespace ParkMeBackend.Services;

public class FavoritesService
{
    private readonly AppDbContext _db;

    public FavoritesService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<int>> GetFavoriteIdsByUserAsync(string userId)
    {
        return await _db.UserFavorites
            .Where(f => f.UserId == userId)
            .Select(f => f.ParkingLotId)
            .ToListAsync();
    }

    public async Task AddFavoriteAsync(string userId, int parkingLotId)
    {
        var exists = await _db.UserFavorites
            .AnyAsync(f => f.UserId == userId && f.ParkingLotId == parkingLotId);

        if (exists) return;

        _db.UserFavorites.Add(new UserFavorite
        {
            UserId = userId,
            ParkingLotId = parkingLotId,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    public async Task RemoveFavoriteAsync(string userId, int parkingLotId)
    {
        var favorite = await _db.UserFavorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ParkingLotId == parkingLotId);

        if (favorite == null) return;

        _db.UserFavorites.Remove(favorite);
        await _db.SaveChangesAsync();
    }
}
