using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ParkMeBackend.Data;
using ParkMeBackend.Models;

namespace ParkMeBackend.Services;

public class ParkingLotService
{
    private readonly string _dataFilePath;
    private readonly AppDbContext _db;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public ParkingLotService(IWebHostEnvironment env, AppDbContext db)
    {
        _dataFilePath = Path.Combine(env.ContentRootPath, "Data", "parkingLots.json");
        _db = db;
    }

    // Tries to load parking lots from Supabase.
    // Falls back to the local JSON file if the database is unreachable or empty.
    public async Task<List<ParkingLot>> GetAllAsync()
    {
        try
        {
            var lots = await _db.ParkingLots.ToListAsync();

            // If Supabase returned rows, use them.
            if (lots.Count > 0)
                return lots;
        }
        catch (Exception ex)
        {
            // Database is unreachable (e.g. wrong password, no internet).
            // Log a warning and use the JSON file as a backup.
            Console.WriteLine($"[ParkingLotService] Could not reach Supabase, using JSON fallback. Error: {ex.Message}");
        }

        // Fallback: load from the local JSON file.
        return await GetAllFromFileAsync();
    }

    // Reads parking lots from the local JSON backup file.
    private async Task<List<ParkingLot>> GetAllFromFileAsync()
    {
        if (!File.Exists(_dataFilePath))
            return [];

        var json = await File.ReadAllTextAsync(_dataFilePath);
        return JsonSerializer.Deserialize<List<ParkingLot>>(json, _jsonOptions) ?? [];
    }

    // Returns all parking lots sorted by the given criterion.
    //
    // sortBy values:
    //   "price"    – ascending by PricePerHour (cheapest first)
    //   "distance" – ascending by distance from (userLat, userLng) (closest first)
    //   null / anything else handled by the controller before this is called
    //
    // Distance notes:
    //   Distance is computed on-the-fly using the Haversine formula from the user's
    //   coordinates to each lot's Latitude/Longitude. There is no stored distance field.
    //   If userLat/userLng are missing when sortBy=distance, we fall back to default order.
    //
    // Price notes:
    //   PricePerHour is a decimal, so no text parsing is needed. Lots with PricePerHour == 0
    //   are treated as free and appear first (they are genuinely the cheapest).
    public async Task<List<ParkingLot>> GetSortedAsync(string? sortBy, double? userLat, double? userLng)
    {
        var lots = await GetAllAsync();

        // Attach distance to every lot when user coordinates are provided.
        // This lets the frontend display distance and ETA without duplicating
        // the Haversine formula on the client side.
        if (userLat.HasValue && userLng.HasValue)
        {
            foreach (var lot in lots)
                lot.Distance = ComputeDistanceKm(userLat.Value, userLng.Value, lot.Latitude, lot.Longitude);
        }

        if (sortBy == "price")
        {
            // Sort ascending by price — cheapest parking lot first.
            return [.. lots.OrderBy(l => l.PricePerHour)];
        }

        if (sortBy == "distance")
        {
            // Distance requires user coordinates; without them we cannot sort meaningfully.
            if (!userLat.HasValue || !userLng.HasValue)
                return lots;

            // Reuse the Distance already computed above — no second Haversine pass needed.
            return [.. lots.OrderBy(l => l.Distance)];
        }

        // sortBy is null → return default order.
        return lots;
    }

    // Haversine formula: returns the great-circle distance in kilometres between two
    // GPS coordinates. Accurate enough for city-scale distances.
    private static double ComputeDistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371; // Earth's mean radius in km
        var dLat = ToRad(lat2 - lat1);
        var dLng = ToRad(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
              * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRad(double degrees) => degrees * Math.PI / 180;

    public async Task SaveAllAsync(List<ParkingLot> parkingLots)
    {
        var json = JsonSerializer.Serialize(parkingLots, _jsonOptions);
        await File.WriteAllTextAsync(_dataFilePath, json);
    }
}
