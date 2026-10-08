import type { Namespace, Socket } from 'socket.io';
import { ClientToServerEvents } from '../events/client-to-server.event.js';
import { ServerToClientEvents } from '../events/server-to-client.event.js';

export interface ChatIdentity {
  userId: string;
  expiresAt: number; // Unix timestamp = millisecond
}

export interface ChatSocketData {
  identity?: ChatIdentity;
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

export type ChatNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  ChatSocketData
>;
