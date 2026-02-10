using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Hubs;
using backend.Models;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=tictactoe.db"));

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseCors();
}

app.MapGet("/api/rooms", async (AppDbContext db, string? status) =>
{
    var query = db.GameRooms.AsQueryable();

    if (Enum.TryParse<GameStatus>(status, true, out var parsed))
        query = query.Where(r => r.Status == parsed);
    else
        query = query.Where(r => r.Status == GameStatus.Waiting);

    var rooms = await query.OrderByDescending(r => r.CreatedAt).Take(50).ToListAsync();
    return Results.Ok(rooms.Select(GameLogic.ToDto));
});

app.MapPost("/api/rooms", async (AppDbContext db, CreateRoomRequest request) =>
{
    var room = new GameRoom
    {
        PlayerXName = request.Name
    };
    db.GameRooms.Add(room);
    await db.SaveChangesAsync();
    return Results.Ok(GameLogic.ToDto(room));
});

app.MapGet("/api/rooms/{roomId}", async (AppDbContext db, string roomId) =>
{
    var room = await db.GameRooms.FindAsync(roomId);
    if (room == null) return Results.NotFound();
    return Results.Ok(GameLogic.ToDto(room));
});

app.MapGet("/api/stats/{name}", async (AppDbContext db, string name) =>
{
    var stats = await db.UserStats.FirstOrDefaultAsync(s => s.Name == name);
    if (stats == null)
        return Results.Ok(new StatsDto(name, 0, 0, 0, 0, DateTime.UtcNow));

    return Results.Ok(new StatsDto(stats.Name, stats.GamesPlayed, stats.Wins, stats.Losses, stats.Draws, stats.LastSeen));
});

app.MapHub<GameHub>("/hub/game");

app.MapFallbackToFile("index.html");

app.Run();
