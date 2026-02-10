namespace backend.Models;

public class UserStats
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int GamesPlayed { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int Draws { get; set; }
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;
}
