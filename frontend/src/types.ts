export interface RoomState {
    id: string;
    createdAt: string;
    status: string;
    playerXName: string;
    playerOName: string | null;
    board: string;
    turn: string;
    winner: string;
    playerXWantsRematch: boolean;
    playerOWantsRematch: boolean;
}

export interface Stats {
    name: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    lastSeen: string;
}
