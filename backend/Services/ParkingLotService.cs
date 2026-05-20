using System.Text.Json;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using ParkMeBackend.Data;
using ParkMeBackend.Models;

namespace ParkMeBackend.Services;

public class ParkingLotService
{
    private static readonly HttpClient _httpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(8)
    };

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

        // Attach driving distance/time to every lot when user coordinates are provided.
        // The frontend can then display realistic values without reimplementing routing.
        if (userLat.HasValue && userLng.HasValue)
        {
            await EnrichWithDrivingMetricsAsync(lots, userLat.Value, userLng.Value);
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

            // Reuse the routing distance already computed above.
            return [.. lots.OrderBy(l => l.Distance ?? double.MaxValue)];
        }

        // sortBy is null → return default order.
        return lots;
    }

    private static async Task EnrichWithDrivingMetricsAsync(List<ParkingLot> lots, double userLat, double userLng)
    {
        var tasks = lots.Select(async lot =>
        {
            var metrics = await GetDrivingMetricsAsync(userLat, userLng, lot.Latitude, lot.Longitude);
            lot.DrivingDistanceKm = metrics.DistanceKm;
            lot.DrivingTimeMinutes = metrics.TimeMinutes;
            lot.Distance = metrics.DistanceKm;
        });

        await Task.WhenAll(tasks);
    }

    private static async Task<(double? DistanceKm, int? TimeMinutes)> GetDrivingMetricsAsync(
        double userLat,
        double userLng,
        double lotLat,
        double lotLng)
    {
        var url = string.Format(
            CultureInfo.InvariantCulture,
            "https://router.project-osrm.org/route/v1/driving/{0},{1};{2},{3}?overview=false",
            userLng,
            userLat,
            lotLng,
            lotLat);

        try
        {
            using var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                return (null, null);

            using var stream = await response.Content.ReadAsStreamAsync();
            using var document = await JsonDocument.ParseAsync(stream);

            if (!document.RootElement.TryGetProperty("routes", out var routes) || routes.GetArrayLength() == 0)
                return (null, null);

            var route = routes[0];
            if (!route.TryGetProperty("distance", out var distanceElement) ||
                !route.TryGetProperty("duration", out var durationElement))
                return (null, null);

            var distanceKm = distanceElement.GetDouble() / 1000d;
            var timeMinutes = (int)Math.Ceiling(durationElement.GetDouble() / 60d);
            return (distanceKm, timeMinutes);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ParkingLotService] OSRM routing failed for lot at ({lotLat}, {lotLng}). Error: {ex.Message}");
            return (null, null);
        }
    }

    public async Task SaveAllAsync(List<ParkingLot> parkingLots)
    {
        var json = JsonSerializer.Serialize(parkingLots, _jsonOptions);
        await File.WriteAllTextAsync(_dataFilePath, json);
    }
}
