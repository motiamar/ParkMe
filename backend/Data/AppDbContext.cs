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

    // DbSet<ParkingLot> represents the parking_lots table.
    // You query it like a list: _db.ParkingLots.ToListAsync()
    public DbSet<ParkingLot> ParkingLots { get; set; }

    // OnModelCreating is called once at startup to configure the mapping
    // between C# property names (PascalCase) and PostgreSQL column names (snake_case).
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ParkingLot>(entity =>
        {
            // Tell EF Core the table in Supabase is called "parking_lots".
            entity.ToTable("parking_lots");

            // Map each C# property to its matching column name in the database.
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.Address).HasColumnName("address");
            entity.Property(e => e.Latitude).HasColumnName("latitude");
            entity.Property(e => e.Longitude).HasColumnName("longitude");
            entity.Property(e => e.PricePerHour).HasColumnName("price_per_hour");
            entity.Property(e => e.AvailableSpaces).HasColumnName("available_spaces");
            entity.Property(e => e.TotalSpaces).HasColumnName("total_spaces");

            // Distance is calculated in the backend from the user's GPS coordinates.
            // It does not exist as a column in the database — EF Core should ignore it.
            entity.Ignore(e => e.Distance);

            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
        });
    }
}
