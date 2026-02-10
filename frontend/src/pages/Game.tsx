import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Typography,
    Container,
    Card,
    CardContent,
    Stack,
    Snackbar,
    Alert,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReplayIcon from "@mui/icons-material/Replay";
import { startConnection, getConnection } from "../signalr";
import type { RoomState } from "../types";

const CELL_MARKS = ["", "✕", "○"];

function BoardCell({
    value,
    index,
    onMove,
    disabled,
    winLine,
}: {
    value: number;
    index: number;
    onMove: (i: number) => void;
    disabled: boolean;
    winLine: boolean;
}) {
    return (
        <Box
            onClick={() => !disabled && value === 0 && onMove(index)}
            sx={{
                width: { xs: 90, sm: 110 },
                height: { xs: 90, sm: 110 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled || value !== 0 ? "default" : "pointer",
                borderRadius: 2,
                background: winLine
                    ? "rgba(92,107,192,0.2)"
                    : value === 0
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(255,255,255,0.05)",
                border: winLine
                    ? "2px solid rgba(92,107,192,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.15s",
                "&:hover": {
                    background:
                        !disabled && value === 0
                            ? "rgba(255,255,255,0.07)"
                            : undefined,
                },
                fontSize: { xs: "2.5rem", sm: "3.5rem" },
                fontWeight: 700,
                color: value === 1 ? "#9fa8da" : value === 2 ? "#ef9a9a" : "transparent",
                userSelect: "none",
            }}
        >
            {CELL_MARKS[value]}
        </Box>
    );
}

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

function getWinCells(board: string): Set<number> {
    const cells = new Set<number>();
    for (const line of WIN_LINES) {
        const c = board[line[0]];
        if (c !== "0" && c === board[line[1]] && c === board[line[2]]) {
            line.forEach((i) => cells.add(i));
        }
    }
    return cells;
}

export default function Game() {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const playerName = localStorage.getItem("playerName");
    const [room, setRoom] = useState<RoomState | null>(null);
    const [myRole, setMyRole] = useState<"X" | "O" | null>(null);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);
    const roleRef = useRef<"X" | "O" | null>(null);

    const handleRoomUpdate = useCallback((state: RoomState) => {
        setRoom(state);
    }, []);

    const handleError = useCallback((msg: string) => {
        setError(msg);
    }, []);

    useEffect(() => {
        if (!playerName) {
            localStorage.setItem("redirectTo", `/game/${roomId}`);
            navigate("/");
            return;
        }

        let mounted = true;

        const connect = async () => {
            try {
                const conn = await startConnection();

                conn.off("RoomStateUpdated");
                conn.off("Error");
                conn.off("AssignRole");

                conn.on("AssignRole", (role: "X" | "O") => {
                    if (mounted) {
                        roleRef.current = role;
                        setMyRole(role);
                    }
                });
                conn.on("RoomStateUpdated", (state: RoomState) => {
                    if (mounted) handleRoomUpdate(state);
                });
                conn.on("Error", (msg: string) => {
                    if (mounted) handleError(msg);
                });

                await conn.invoke("JoinRoom", roomId, playerName);
            } catch {
                if (mounted) setError("Connection failed");
            }
        };

        connect();

        return () => {
            mounted = false;
            const conn = getConnection();
            conn.off("RoomStateUpdated");
            conn.off("Error");
            conn.off("AssignRole");
        };
    }, [roomId, playerName, navigate, handleRoomUpdate, handleError]);

    const makeMove = async (cellIndex: number) => {
        try {
            const conn = getConnection();
            await conn.invoke("MakeMove", roomId, playerName, cellIndex);
        } catch {
            setError("Failed to make move");
        }
    };

    const requestRematch = async () => {
        try {
            const conn = getConnection();
            await conn.invoke("RequestRematch", roomId, playerName);
        } catch {
            setError("Failed to request rematch");
        }
    };

    const copyInviteLink = () => {
        const url = `${window.location.origin}/game/${roomId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
    };

    const handleLeave = () => {
        navigate("/lobby");
    };

    if (!room) {
        return (
            <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
                <Typography variant="h5" sx={{ color: "rgba(255,255,255,0.4)" }}>
                    Connecting...
                </Typography>
            </Container>
        );
    }

    const isMyTurn = room.status === "Playing" && room.turn === myRole;
    const isFinished = room.status === "Finished";
    const isAbandoned = room.status === "Abandoned";
    const board = room.board.split("").map(Number);
    const winCells = getWinCells(room.board);
    const iWantRematch = myRole === "X" ? room.playerXWantsRematch : room.playerOWantsRematch;
    const opponentWantsRematch = myRole === "X" ? room.playerOWantsRematch : room.playerXWantsRematch;

    let statusText = "";
    if (room.status === "Waiting") statusText = "Waiting for opponent...";
    else if (isAbandoned) statusText = "Opponent disconnected";
    else if (isFinished) {
        if (room.winner === "Draw") statusText = "It's a draw!";
        else if (room.winner === myRole) statusText = "You won! 🎉";
        else statusText = "You lost";
    } else if (isMyTurn) statusText = "Your turn";
    else statusText = "Opponent's turn";

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleLeave}
                    sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                    Leave
                </Button>
                <Tooltip title="Copy invite link">
                    <IconButton onClick={copyInviteLink} sx={{ color: "rgba(255,255,255,0.6)" }}>
                        <ContentCopyIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Card sx={{ background: "#22223a" }}>
                <CardContent sx={{ p: { xs: 2, sm: 4 }, textAlign: "center" }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 3 }}
                    >
                        <Box sx={{ textAlign: "left" }}>
                            <Chip
                                label={`✕ ${room.playerXName}`}
                                sx={{
                                    fontWeight: 600,
                                    backgroundColor:
                                        room.turn === "X" && room.status === "Playing"
                                            ? "rgba(159,168,218,0.15)"
                                            : "rgba(255,255,255,0.06)",
                                    color: "#9fa8da",
                                    border:
                                        room.turn === "X" && room.status === "Playing"
                                            ? "1px solid rgba(159,168,218,0.4)"
                                            : "1px solid transparent",
                                }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.25)" }}>
                            VS
                        </Typography>
                        <Box sx={{ textAlign: "right" }}>
                            <Chip
                                label={`○ ${room.playerOName || "..."}`}
                                sx={{
                                    fontWeight: 600,
                                    backgroundColor:
                                        room.turn === "O" && room.status === "Playing"
                                            ? "rgba(239,154,154,0.12)"
                                            : "rgba(255,255,255,0.06)",
                                    color: "#ef9a9a",
                                    border:
                                        room.turn === "O" && room.status === "Playing"
                                            ? "1px solid rgba(239,154,154,0.35)"
                                            : "1px solid transparent",
                                }}
                            />
                        </Box>
                    </Stack>

                    <Typography
                        variant="h6"
                        sx={{
                            mb: 3,
                            color: isFinished
                                ? room.winner === myRole
                                    ? "#81c784"
                                    : room.winner === "Draw"
                                        ? "#ffb74d"
                                        : "#ef5350"
                                : isMyTurn
                                    ? "#e0e0e0"
                                    : "rgba(255,255,255,0.4)",
                            fontWeight: 600,
                        }}
                    >
                        {statusText}
                    </Typography>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 1.5,
                            justifyItems: "center",
                            maxWidth: 360,
                            mx: "auto",
                            mb: 3,
                        }}
                    >
                        {board.map((cell, i) => (
                            <BoardCell
                                key={i}
                                value={cell}
                                index={i}
                                onMove={makeMove}
                                disabled={!isMyTurn || isFinished || isAbandoned}
                                winLine={winCells.has(i)}
                            />
                        ))}
                    </Box>

                    {isFinished && (
                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button
                                variant="contained"
                                startIcon={<ReplayIcon />}
                                onClick={requestRematch}
                                disabled={iWantRematch}
                                sx={{
                                    backgroundColor: iWantRematch ? "rgba(255,255,255,0.08)" : "#5c6bc0",
                                    "&:hover": { backgroundColor: iWantRematch ? undefined : "#4a5ab5" },
                                }}
                            >
                                {iWantRematch
                                    ? opponentWantsRematch
                                        ? "Starting..."
                                        : "Waiting for opponent..."
                                    : opponentWantsRematch
                                        ? "Accept Rematch"
                                        : "Rematch"}
                            </Button>
                        </Stack>
                    )}

                    {isAbandoned && (
                        <Button
                            variant="outlined"
                            onClick={handleLeave}
                            sx={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                        >
                            Back to Lobby
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}>
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Invite link copied!
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={3000}
                onClose={() => setError("")}
            >
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
}
