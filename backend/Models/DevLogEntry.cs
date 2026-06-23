namespace ParkMeBackend.Models;

public class DevLogEntry
{
    public DateTime Timestamp { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public long DurationMs { get; set; }
}