import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    TextField,
    Button,
    Typography,
    Container,
    Card,
    CardContent,
} from "@mui/material";


export default function NameEntry() {
    const [name, setName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const saved = localStorage.getItem("playerName");
        if (saved) {
            const redirect = localStorage.getItem("redirectTo");
            localStorage.removeItem("redirectTo");
            navigate(redirect || "/lobby");
        }
    }, [navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        localStorage.setItem("playerName", trimmed);
        const redirect = localStorage.getItem("redirectTo");
        localStorage.removeItem("redirectTo");
        navigate(redirect || "/lobby");
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Card
                    sx={{
                        width: "100%",
                        background: "#22223a",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    <CardContent sx={{ p: 5, textAlign: "center" }}>

                        <Typography variant="h4" gutterBottom sx={{ color: "#e0e0e0" }}>
                            Tic Tac Toe
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ color: "rgba(255,255,255,0.5)", mb: 4 }}
                        >
                            Enter your name to start playing
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                variant="outlined"
                                sx={{
                                    mb: 3,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2.5,
                                        backgroundColor: "rgba(255,255,255,0.04)",
                                    },
                                }}
                                autoFocus
                            />
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={!name.trim()}
                                sx={{
                                    py: 1.5,
                                    fontSize: "1.05rem",
                                    backgroundColor: "#5c6bc0",
                                    "&:hover": { backgroundColor: "#4a5ab5" },
                                }}
                            >
                                Play Now
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}
