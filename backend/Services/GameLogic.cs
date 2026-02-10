using backend.Models;

namespace backend.Services;

public static class GameLogic
{
    private static readonly int[][] WinLines =
    [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    public static GameResult CheckWinner(string board)
    {
        foreach (var line in WinLines)
        {
            char c = board[line[0]];
            if (c != '0' && c == board[line[1]] && c == board[line[2]])
                return c == '1' ? GameResult.X : GameResult.O;
        }

        if (!board.Contains('0'))
            return GameResult.Draw;

        return GameResult.None;
    }

    public static RoomDto ToDto(GameRoom room)
    {
        return new RoomDto(
            room.Id,
            room.CreatedAt,
            room.Status.ToString(),
            room.PlayerXName,
            room.PlayerOName,
            room.Board,
            room.Turn.ToString(),
            room.Winner.ToString(),
            room.PlayerXWantsRematch,
            room.PlayerOWantsRematch
        );
    }
}
