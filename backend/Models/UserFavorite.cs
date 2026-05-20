namespace ParkMeBackend.Models;

public class UserFavorite
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int ParkingLotId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}