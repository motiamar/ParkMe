namespace ParkMeBackend.Models;

public class ParkingLot
{
    public int Id { get; set; }
    public string? NameEn { get; set; }
    public string? NameHe { get; set; }
    public string? AddressEn { get; set; }
    public string? AddressHe { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public decimal PricePerHour { get; set; }
    public int AvailableSpaces { get; set; }
    public int TotalSpaces { get; set; }
    public string? ImageUrl { get; set; }
    public double? Distance { get; set; }
    public double? DrivingDistanceKm { get; set; }
    public int? DrivingTimeMinutes { get; set; }
}
