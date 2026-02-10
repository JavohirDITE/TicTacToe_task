namespace backend.Models;

public record CreateRoomRequest(string Name);

public record RoomDto(
    string Id,
    DateTime CreatedAt,
    string Status,
    string PlayerXName,
    string? PlayerOName,
    string Board,
    string Turn,
    string Winner,
    bool PlayerXWantsRematch,
    bool PlayerOWantsRematch
);

public record StatsDto(
    string Name,
    int GamesPlayed,
    int Wins,
    int Losses,
    int Draws,
    DateTime LastSeen
);
