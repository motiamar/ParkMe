using Microsoft.EntityFrameworkCore;
using ParkMeBackend.Data;
using ParkMeBackend.Models;

namespace ParkMeBackend.Services;

public class AuditLogService
{
    private readonly AppDbContext _db;

    public AuditLogService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(string userId, string actionType, string entityType, string? entityId, string? description)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            ActionType = actionType,
            EntityType = entityType,
            EntityId = entityId,
            Description = description,
            Timestamp = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    public async Task<List<AuditLog>> GetAllAsync()
    {
        return await _db.AuditLogs
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();
    }
}
