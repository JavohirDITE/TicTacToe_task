import { HubConnectionBuilder, HubConnection, LogLevel } from "@microsoft/signalr";

let connection: HubConnection | null = null;

export function getConnection(): HubConnection {
    if (!connection) {
        connection = new HubConnectionBuilder()
            .withUrl("/hub/game")
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();
    }
    return connection;
}

export async function startConnection(): Promise<HubConnection> {
    const conn = getConnection();
    if (conn.state === "Disconnected") {
        await conn.start();
    }
    return conn;
}
