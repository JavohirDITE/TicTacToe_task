using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;

namespace backend.Hubs;

public class GameHub : Hub
{
    private readonly AppDbContext _db;

    public GameHub(AppDbContext db)
    {
        _db = db;
    }

    public async Task JoinRoom(string roomId, string playerName)
    {
        var room = await _db.GameRooms.FindAsync(roomId);

        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", "Room not found");
            return;
        }

        if (room.Status == GameStatus.Playing && room.PlayerXConnectionId != Context.ConnectionId && room.PlayerOConnectionId != Context.ConnectionId)
        {
            await Clients.Caller.SendAsync("Error", "Room is full");
            return;
        }

        if (room.Status == GameStatus.Waiting && room.PlayerXName == playerName && room.PlayerXConnectionId == null)
        {
            room.PlayerXConnectionId = Context.ConnectionId;
        }
        else if (room.Status == GameStatus.Waiting && room.PlayerXConnectionId == Context.ConnectionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.Caller.SendAsync("AssignRole", "X");
            await Clients.Caller.SendAsync("RoomStateUpdated", GameLogic.ToDto(room));
            return;
        }
        else if (room.Status == GameStatus.Waiting && room.PlayerOName == null)
        {
            room.PlayerOName = playerName;
            room.PlayerOConnectionId = Context.ConnectionId;
            room.Status = GameStatus.Playing;
        }
        else if (room.PlayerXConnectionId == Context.ConnectionId || room.PlayerOConnectionId == Context.ConnectionId)
        {
        }
        else if (room.PlayerXName == playerName && room.PlayerXConnectionId == null)
        {
            room.PlayerXConnectionId = Context.ConnectionId;
        }
        else if (room.PlayerOName == playerName && room.PlayerOConnectionId == null)
        {
            room.PlayerOConnectionId = Context.ConnectionId;
        }
        else
        {
            await Clients.Caller.SendAsync("Error", "Room is full");
            return;
        }

        await _db.SaveChangesAsync();
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

        if (room.PlayerXConnectionId == Context.ConnectionId)
            await Clients.Caller.SendAsync("AssignRole", "X");
        else if (room.PlayerOConnectionId == Context.ConnectionId)
            await Clients.Caller.SendAsync("AssignRole", "O");

        await Clients.Group(roomId).SendAsync("RoomStateUpdated", GameLogic.ToDto(room));
    }

    public async Task MakeMove(string roomId, string playerName, int cellIndex)
    {
        var room = await _db.GameRooms.FindAsync(roomId);

        if (room == null || room.Status != GameStatus.Playing)
        {
            await Clients.Caller.SendAsync("Error", "Invalid game state");
            return;
        }

        if (cellIndex < 0 || cellIndex > 8)
        {
            await Clients.Caller.SendAsync("Error", "Invalid cell");
            return;
        }

        bool isPlayerX = room.PlayerXConnectionId == Context.ConnectionId;
        bool isPlayerO = room.PlayerOConnectionId == Context.ConnectionId;

        if (!isPlayerX && !isPlayerO)
        {
            await Clients.Caller.SendAsync("Error", "You are not in this game");
            return;
        }

        if ((room.Turn == CellMark.X && !isPlayerX) || (room.Turn == CellMark.O && !isPlayerO))
        {
            await Clients.Caller.SendAsync("Error", "Not your turn");
            return;
        }

        if (room.Board[cellIndex] != '0')
        {
            await Clients.Caller.SendAsync("Error", "Cell is taken");
            return;
        }

        char mark = room.Turn == CellMark.X ? '1' : '2';
        var boardChars = room.Board.ToCharArray();
        boardChars[cellIndex] = mark;
        room.Board = new string(boardChars);

        var result = GameLogic.CheckWinner(room.Board);

        if (result != GameResult.None)
        {
            room.Winner = result;
            room.Status = GameStatus.Finished;
            await UpdateStats(room);
        }
        else
        {
            room.Turn = room.Turn == CellMark.X ? CellMark.O : CellMark.X;
        }

        await _db.SaveChangesAsync();
        await Clients.Group(roomId).SendAsync("RoomStateUpdated", GameLogic.ToDto(room));
    }

    public async Task RequestRematch(string roomId, string playerName)
    {
        var room = await _db.GameRooms.FindAsync(roomId);

        if (room == null || room.Status != GameStatus.Finished)
        {
            await Clients.Caller.SendAsync("Error", "Cannot rematch now");
            return;
        }

        bool isPlayerX = room.PlayerXConnectionId == Context.ConnectionId;
        bool isPlayerO = room.PlayerOConnectionId == Context.ConnectionId;

        if (isPlayerX) room.PlayerXWantsRematch = true;
        if (isPlayerO) room.PlayerOWantsRematch = true;

        if (room.PlayerXWantsRematch && room.PlayerOWantsRematch)
        {
            room.Board = "000000000";
            room.Turn = CellMark.X;
            room.Winner = GameResult.None;
            room.Status = GameStatus.Playing;
            room.PlayerXWantsRematch = false;
            room.PlayerOWantsRematch = false;
        }

        await _db.SaveChangesAsync();
        await Clients.Group(roomId).SendAsync("RoomStateUpdated", GameLogic.ToDto(room));
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var rooms = await _db.GameRooms
            .Where(r => r.PlayerXConnectionId == Context.ConnectionId || r.PlayerOConnectionId == Context.ConnectionId)
            .ToListAsync();

        foreach (var room in rooms)
        {
            if (room.Status == GameStatus.Waiting)
            {
                room.Status = GameStatus.Abandoned;
            }
            else if (room.Status == GameStatus.Playing)
            {
                room.Status = GameStatus.Abandoned;

                if (room.PlayerXConnectionId == Context.ConnectionId)
                    room.PlayerXConnectionId = null;
                else
                    room.PlayerOConnectionId = null;
            }
            else if (room.Status == GameStatus.Finished)
            {
                if (room.PlayerXConnectionId == Context.ConnectionId)
                    room.PlayerXConnectionId = null;
                else
                    room.PlayerOConnectionId = null;
            }

            await Clients.Group(room.Id).SendAsync("RoomStateUpdated", GameLogic.ToDto(room));
        }

        await _db.SaveChangesAsync();
        await base.OnDisconnectedAsync(exception);
    }

    private async Task UpdateStats(GameRoom room)
    {
        var xStats = await GetOrCreateStats(room.PlayerXName);
        var oStats = await GetOrCreateStats(room.PlayerOName!);

        xStats.GamesPlayed++;
        oStats.GamesPlayed++;
        xStats.LastSeen = DateTime.UtcNow;
        oStats.LastSeen = DateTime.UtcNow;

        switch (room.Winner)
        {
            case GameResult.X:
                xStats.Wins++;
                oStats.Losses++;
                break;
            case GameResult.O:
                oStats.Wins++;
                xStats.Losses++;
                break;
            case GameResult.Draw:
                xStats.Draws++;
                oStats.Draws++;
                break;
        }
    }

    private async Task<UserStats> GetOrCreateStats(string name)
    {
        var stats = await _db.UserStats.FirstOrDefaultAsync(s => s.Name == name);
        if (stats == null)
        {
            stats = new UserStats { Name = name };
            _db.UserStats.Add(stats);
        }
        return stats;
    }
}
