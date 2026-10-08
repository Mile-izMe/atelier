import { UsersService } from '#app/modules/user/user.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { ChatSocket } from './interface/chat-socket.interface.js';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly jwt: JwtService,
    private readonly user: UsersService,
  ) {}

  async authenticate(socket: ChatSocket) {
    const token = socket.handshake.auth.token;
    if (typeof token !== 'string' || !token || token.length > 4096) {
      throw new WsException({
        code: 'AUTH_INVALID',
        message: 'Access token required',
      });
    }

    const payload = await this.jwt.verifyAsync<{
      sub?: unknown;
      exp?: unknown;
    }>(token);

    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    await this.user.getUserProfile(payload.sub);

    socket.data.identity = {
      userId: payload.sub,
      expiresAt: payload.exp * 1000,
    };
  }
}
