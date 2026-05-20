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

    private readonly AppDbContext _db;

    public ParkingLotService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ParkingLot>> GetAllAsync()
    {
        return await _db.ParkingLots
            .AsNoTracking()
            .OrderBy(lot => lot.Id)
            .ToListAsync();
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

}
