import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Typography,
    Container,
    Card,
    CardContent,
    Chip,
    Stack,
    IconButton,
    Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import LoginIcon from "@mui/icons-material/Login";
import { fetchRooms, createRoom } from "../api";
import type { RoomState } from "../types";

export default function Lobby() {
    const [rooms, setRooms] = useState<RoomState[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const playerName = localStorage.getItem("playerName");

    useEffect(() => {
        if (!playerName) navigate("/");
    }, [playerName, navigate]);

    const loadRooms = useCallback(async () => {
        try {
            const data = await fetchRooms("waiting");
            setRooms(data);
        } catch {
            /* retry on next interval */
        }
    }, []);

    useEffect(() => {
        loadRooms();
        const interval = setInterval(loadRooms, 3000);
        return () => clearInterval(interval);
    }, [loadRooms]);

    const handleCreate = async () => {
        if (!playerName) return;
        setLoading(true);
        try {
            const room = await createRoom(playerName);
            navigate(`/game/${room.id}`);
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case "Waiting": return "warning";
            case "Playing": return "info";
            case "Finished": return "success";
            default: return "default";
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Typography variant="h4" sx={{ color: "#e0e0e0" }}>
                    Game Lobby
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadRooms} sx={{ color: "rgba(255,255,255,0.5)" }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreate}
                        disabled={loading}
                        sx={{
                            backgroundColor: "#5c6bc0",
                            "&:hover": { backgroundColor: "#4a5ab5" },
                        }}
                    >
                        Create Game
                    </Button>
                </Stack>
            </Box>

            {rooms.length === 0 && (
                <Card sx={{ background: "#22223a", textAlign: "center", py: 6 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.45)" }}>
                            No games available
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.3)", mt: 1 }}>
                            Create a new game to get started
                        </Typography>
                    </CardContent>
                </Card>
            )}

            <Stack spacing={2}>
                {rooms.map((room) => (
                    <Card
                        key={room.id}
                        sx={{
                            background: "#22223a",
                            transition: "border-color 0.2s",
                            "&:hover": {
                                borderColor: "rgba(255,255,255,0.2)",
                            },
                        }}
                    >
                        <CardContent
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                py: 2,
                                "&:last-child": { pb: 2 },
                            }}
                        >
                            <Box>
                                <Typography variant="h6" sx={{ color: "#e0e0e0" }}>
                                    {room.playerXName}'s Game
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                    <Chip
                                        label={room.status}
                                        color={statusColor(room.status) as any}
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }}>
                                        {formatTime(room.createdAt)}
                                    </Typography>
                                </Stack>
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={<LoginIcon />}
                                onClick={() => navigate(`/game/${room.id}`)}
                                sx={{
                                    borderColor: "rgba(255,255,255,0.2)",
                                    color: "#9fa8da",
                                    "&:hover": {
                                        borderColor: "#5c6bc0",
                                        backgroundColor: "rgba(92,107,192,0.08)",
                                    },
                                }}
                            >
                                Join
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        </Container>
    );
}
