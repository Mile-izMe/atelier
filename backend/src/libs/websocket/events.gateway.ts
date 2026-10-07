import { Inject } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { IncomingMessage } from 'node:http';
import type { WebsocketOptions } from './interface/websocket.interface.js';
import { WEBSOCKET_OPTIONS } from './websocket.module-definition.js';

const allowedOrigins = () =>
  (process.env.CHAT_ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

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
export class EventsGateway {
  constructor(
    @Inject(WEBSOCKET_OPTIONS)
    private readonly _options: WebsocketOptions,
  ) {}

  @SubscribeMessage('ping')
  handlePing() {
    return {
      event: 'pong',
      data: {
        message: 'Gateway received ping',
        roomPrefix: this._options.roomPrefix,
      },
    };
  }
}
