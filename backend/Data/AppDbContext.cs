using Microsoft.EntityFrameworkCore;
using ParkMeBackend.Models;

namespace ParkMeBackend.Data;

// AppDbContext is the bridge between your C# code and the Supabase PostgreSQL database.
// Entity Framework Core uses this class to know which tables exist and how they map
// to your C# model classes.
public class AppDbContext : DbContext
{
    // The options (connection string, provider, etc.) are injected from Program.cs.
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<ParkingLot> ParkingLots { get; set; }
    public DbSet<UserFavorite> UserFavorites { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    // OnModelCreating is called once at startup to configure the mapping
    // between C# property names (PascalCase) and PostgreSQL column names (snake_case).
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ParkingLot>(entity =>
        {
            // Tell EF Core the table in Supabase is called "parking_lots".
            entity.ToTable("parking_lots", "public");

            // Map each C# property to its matching column name in the database.
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.NameEn).HasColumnName("name_en");
            entity.Property(e => e.NameHe).HasColumnName("name_he");
            entity.Property(e => e.AddressEn).HasColumnName("address_en");
            entity.Property(e => e.AddressHe).HasColumnName("address_he");
            entity.Property(e => e.Latitude).HasColumnName("latitude");
            entity.Property(e => e.Longitude).HasColumnName("longitude");
            entity.Property(e => e.PricePerHour).HasColumnName("price_per_hour");
            entity.Property(e => e.AvailableSpaces).HasColumnName("available_spaces");
            entity.Property(e => e.TotalSpaces).HasColumnName("total_spaces");

            // Distance is calculated in the backend from the user's GPS coordinates.
            // It does not exist as a column in the database — EF Core should ignore it.
            entity.Ignore(e => e.Distance);
            entity.Ignore(e => e.DrivingDistanceKm);
            entity.Ignore(e => e.DrivingTimeMinutes);

            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
        });

        modelBuilder.Entity<UserFavorite>(entity =>
        {
            entity.ToTable("user_favorites");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ParkingLotId).HasColumnName("parking_lot_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_logs", "public");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ActionType).HasColumnName("action_type");
            entity.Property(e => e.EntityType).HasColumnName("entity_type");
            entity.Property(e => e.EntityId).HasColumnName("entity_id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Timestamp).HasColumnName("timestamp");
        });
    }
}
