namespace ParkMeBackend.Models;

public class ParkingLot
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public decimal PricePerHour { get; set; }
    public int AvailableSpaces { get; set; }
    public int TotalSpaces { get; set; }
    public string? Image { get; set; }
}
