import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ChatErrorDetail } from '../websocket/events/server-to-client.event.js';
import { ChatSocket } from '../websocket/interface/chat-socket.interface.js';

const logger = new Logger('ChatExceptionFilter');

function readMessage(value: unknown, fallback: string): string | string[] {
  if (typeof value === 'string') return value;

  if (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === 'string')
  ) {
    return value;
  }

  return fallback;
}

export function chatError(error: unknown): ChatErrorDetail {
  if (error instanceof WsException) {
    const detail = error.getError();

    if (typeof detail === 'string') {
      return { code: 'CHAT_ERROR', message: detail };
    }

    return {
      code:
        'code' in detail && typeof detail.code === 'string'
          ? detail.code
          : 'CHAT_ERROR',
      message: readMessage(
        'message' in detail ? detail.message : undefined,
        'Unable to process this event',
      ),
    };
  }
  if (error instanceof HttpException && error.getStatus() < 500) {
    const status = error.getStatus();
    const codes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'AUTH_INVALID',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMITED',
    };
    const response = error.getResponse();
    return {
      code: codes[status] ?? 'CHAT_ERROR',
      message: readMessage(
        typeof response === 'object' &&
          response !== null &&
          'message' in response
          ? response.message
          : undefined,
        error.message,
      ),
    };
  }
  logger.error(
    'Unexpected chat failure',
    error instanceof Error ? error.stack : String(error),
  );
  return { code: 'INTERNAL_ERROR', message: 'Unable to process this event' };
}

@Catch()
export class ChatExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = { success: false as const, error: chatError(error) };
    const acknowledge = host.getArgByIndex<unknown>(2);
    if (typeof acknowledge === 'function') acknowledge(response);
    else host.switchToWs().getClient<ChatSocket>().emit('chat.error', response);
  }
}
