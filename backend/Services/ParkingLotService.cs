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

    public async Task SaveAllAsync(List<ParkingLot> parkingLots)
    {
        var json = JsonSerializer.Serialize(parkingLots, _jsonOptions);
        await File.WriteAllTextAsync(_dataFilePath, json);
    }
}
