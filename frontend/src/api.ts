export async function fetchRooms(status = "waiting") {
    const res = await fetch(`/api/rooms?status=${status}`);
    return res.json();
}

export async function createRoom(name: string) {
    const res = await fetch(`/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    return res.json();
}

export async function fetchRoom(roomId: string) {
    const res = await fetch(`/api/rooms/${roomId}`);
    return res.json();
}

export async function fetchStats(name: string) {
    const res = await fetch(`/api/stats/${encodeURIComponent(name)}`);
    return res.json();
}
