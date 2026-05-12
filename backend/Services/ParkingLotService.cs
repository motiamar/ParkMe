using System.Text.Json;
using ParkMeBackend.Models;

namespace ParkMeBackend.Services;

public class ParkingLotService
{
    private readonly string _dataFilePath;
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public ParkingLotService(IWebHostEnvironment env)
    {
        _dataFilePath = Path.Combine(env.ContentRootPath, "Data", "parkingLots.json");
    }

    public async Task<List<ParkingLot>> GetAllAsync()
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
    //
    // Missing/unclear values:
    //   Since both PricePerHour (decimal) and Latitude/Longitude (double) are non-nullable
    //   value types in this model, there are no null entries. The "missing values go to end"
    //   rule applies mainly if this model is extended later with nullable fields.
    public async Task<List<ParkingLot>> GetSortedAsync(string? sortBy, double? userLat, double? userLng)
    {
        var lots = await GetAllAsync();

        if (sortBy == "price")
        {
            // Sort ascending by price — cheapest parking lot first.
            return lots.OrderBy(l => l.PricePerHour).ToList();
        }

        if (sortBy == "distance")
        {
            // Distance requires user coordinates; without them we cannot sort meaningfully.
            if (!userLat.HasValue || !userLng.HasValue)
                return lots;

            // Sort ascending by computed great-circle distance from the user's position.
            return lots
                .OrderBy(l => ComputeDistanceKm(userLat.Value, userLng.Value, l.Latitude, l.Longitude))
                .ToList();
        }

        // sortBy is null → return default (file) order.
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
