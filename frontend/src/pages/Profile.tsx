import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Stack,
    Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { fetchStats } from "../api";
import type { Stats } from "../types";

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <Box
            sx={{
                textAlign: "center",
                p: 2,
                borderRadius: 2,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                flex: 1,
            }}
        >
            <Typography variant="h4" sx={{ color, fontWeight: 700 }}>
                {value}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", mt: 0.5 }}>
                {label}
            </Typography>
        </Box>
    );
}

export default function Profile() {
    const navigate = useNavigate();
    const playerName = localStorage.getItem("playerName");
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        if (!playerName) {
            navigate("/");
            return;
        }
        fetchStats(playerName).then(setStats);
    }, [playerName, navigate]);

    if (!stats) return null;

    const winRate = stats.gamesPlayed > 0
        ? Math.round((stats.wins / stats.gamesPlayed) * 100)
        : 0;

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/lobby")}
                sx={{ color: "rgba(255,255,255,0.6)", mb: 3 }}
            >
                Back to Lobby
            </Button>

            <Card sx={{ background: "#22223a" }}>
                <CardContent sx={{ p: 4, textAlign: "center" }}>
                    <EmojiEventsIcon sx={{ fontSize: 52, color: "#ffb74d", mb: 1 }} />
                    <Typography variant="h4" sx={{ color: "#e0e0e0", mb: 0.5 }}>
                        {stats.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.4)", mb: 4 }}>
                        {stats.gamesPlayed} games • {winRate}% win rate
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <StatBox label="Wins" value={stats.wins} color="#81c784" />
                        <StatBox label="Losses" value={stats.losses} color="#ef5350" />
                        <StatBox label="Draws" value={stats.draws} color="#ffb74d" />
                    </Stack>

                    <Typography
                        variant="caption"
                        sx={{ display: "block", color: "rgba(255,255,255,0.25)", mt: 3 }}
                    >
                        Last seen: {new Date(stats.lastSeen).toLocaleString()}
                    </Typography>
                </CardContent>
            </Card>
        </Container>
    );
}
