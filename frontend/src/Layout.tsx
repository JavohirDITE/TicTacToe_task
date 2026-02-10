import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Stack,
    IconButton,
} from "@mui/material";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [name, setName] = useState(localStorage.getItem("playerName"));

    const isNamePage = location.pathname === "/";

    const handleChangeName = () => {
        localStorage.removeItem("playerName");
        setName(null);
        navigate("/");
    };

    if (isNamePage) return <Outlet />;

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <AppBar
                position="sticky"
                sx={{
                    background: "#22223a",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}
            >
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ cursor: "pointer" }}
                        onClick={() => navigate("/lobby")}
                    >
                        <SportsEsportsIcon sx={{ color: "#9fa8da" }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#e0e0e0" }}>
                            TicTacToe
                        </Typography>
                    </Stack>

                    {name && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Button
                                startIcon={<PersonIcon />}
                                onClick={() => navigate("/profile")}
                                sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 500 }}
                            >
                                {name}
                            </Button>
                            <IconButton onClick={handleChangeName} size="small" sx={{ color: "rgba(255,255,255,0.4)" }}>
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    )}
                </Toolbar>
            </AppBar>
            <Outlet />
        </Box>
    );
}
