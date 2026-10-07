import type { Socket } from 'socket.io';

export interface ChatIdentity {
  userId: string;
  expiresAt: number; // Unix timestamp = millisecond
}

export interface ChatSocketData {
  identity?: ChatIdentity;
}

export interface ClientToServerEvents {
  ping: () => void;
}

export interface ServerToClientEvents {
  pong: (data: { message: string; roomPrefix: string }) => void;
}

/*
1. Event client to server.
2. Event server to client.
3. Event between server — not define.
4. Server's data kept on each socket.
*/
export type ChatSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  ChatSocketData
>;
