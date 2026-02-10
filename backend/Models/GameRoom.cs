namespace backend.Models;

public enum GameStatus { Waiting, Playing, Finished, Abandoned }
public enum CellMark { None, X, O }
public enum GameResult { None, X, O, Draw }

public class GameRoom
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public GameStatus Status { get; set; } = GameStatus.Waiting;
    public string PlayerXName { get; set; } = string.Empty;
    public string? PlayerOName { get; set; }
    public string? PlayerXConnectionId { get; set; }
    public string? PlayerOConnectionId { get; set; }
    public string Board { get; set; } = "000000000";
    public CellMark Turn { get; set; } = CellMark.X;
    public GameResult Winner { get; set; } = GameResult.None;
    public bool PlayerXWantsRematch { get; set; }
    public bool PlayerOWantsRematch { get; set; }
}
