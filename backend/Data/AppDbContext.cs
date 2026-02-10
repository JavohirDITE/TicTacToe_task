using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<GameRoom> GameRooms => Set<GameRoom>();
    public DbSet<UserStats> UserStats => Set<UserStats>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameRoom>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Status).HasConversion<string>();
            e.Property(r => r.Turn).HasConversion<string>();
            e.Property(r => r.Winner).HasConversion<string>();
        });

        modelBuilder.Entity<UserStats>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.Name);
        });
    }
}
