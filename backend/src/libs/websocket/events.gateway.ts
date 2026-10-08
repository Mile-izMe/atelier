import { Inject, UseFilters } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { IncomingMessage } from 'node:http';
import {
  chatError,
  ChatExceptionFilter,
} from '../exceptions/chat-exception.filter.js';
import type {
  ChatNamespace,
  ChatSocket,
} from './interface/chat-socket.interface.js';
import type { WebsocketOptions } from './interface/websocket.interface.js';
import { WEBSOCKET_OPTIONS } from './websocket.module-definition.js';
import { WebsocketService } from './websocket.service.js';

const allowedOrigins = () =>
  (process.env.CHAT_ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

@UseFilters(ChatExceptionFilter)
@WebSocketGateway({
  namespace: '/chat',
  maxHttpBufferSize: 32_768,
  cors: {
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow: boolean) => void,
    ) => callback(null, !origin || allowedOrigins().includes(origin)),
  },
  // CORS alone does not restrict WebSocket upgrades. Validate Origin too.
  allowRequest: (
    request: IncomingMessage,
    callback: (error: string | null, allow: boolean) => void,
  ) =>
    callback(
      null,
      !request.headers.origin ||
        allowedOrigins().includes(request.headers.origin),
    ),
})
export class EventsGateway
  implements
    OnGatewayInit<ChatNamespace>,
    OnGatewayConnection,
    OnGatewayDisconnect
{
  private readonly expiryTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    @Inject(WEBSOCKET_OPTIONS)
    private readonly _options: WebsocketOptions,
    private readonly websocket: WebsocketService,
  ) {}

  // Register authenticated middleware
  afterInit(server: ChatNamespace): void {
    server.use((socket, next) => {
      void this.websocket
        .authenticate(socket)
        .then(() => next())
        .catch((error: unknown) => {
          const rejected = new Error('Chat connection rejected') as Error & {
            data?: unknown;
          };
          rejected.data = chatError(error);
          next(rejected);
        });
    });
  }

  // Check available time
  handleConnection(socket: ChatSocket): void {
    const remaining = (socket.data.identity?.expiresAt ?? 0) - Date.now();
    if (remaining <= 0) {
      socket.disconnect(true);
      return;
    }
    const timer = setTimeout(() => {
      socket.emit('chat.error', {
        success: false,
        error: {
          code: 'AUTH_EXPIRED',
          message: 'Reconnect with a fresh access token',
        },
      });

      socket.disconnect();
    }, remaining);

    this.expiryTimers.set(socket.id, timer);
  }

  handleDisconnect(socket: ChatSocket): void {
    const timer = this.expiryTimers.get(socket.id);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(socket.id);
    }
  }
}
