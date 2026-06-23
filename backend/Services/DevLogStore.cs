using ParkMeBackend.Models;

namespace ParkMeBackend.Services;

public class DevLogStore
{
    private const int MaxEntries = 100;
    private readonly List<DevLogEntry> _entries = [];
    private readonly object _lock = new();

    public void AddLog(DevLogEntry entry)
    {
        lock (_lock)
        {
            _entries.Insert(0, entry);

            if (_entries.Count > MaxEntries)
            {
                _entries.RemoveRange(MaxEntries, _entries.Count - MaxEntries);
            }
        }
    }

    public List<DevLogEntry> GetRecentLogs()
    {
        lock (_lock)
        {
            return [.. _entries];
        }
    }
}