import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import {
  JsonWebTokenError,
  JwtService,
  NotBeforeError,
  TokenExpiredError,
} from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import type { UserProfile } from '#app/modules/user/entities/user.entity';
import { UsersService } from '#app/modules/user/user.service';

export type AuthenticatedRequest = Request & { user: UserProfile };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: UserProfile }>();
    const token = /^Bearer ([^\s]+)$/i.exec(
      request.headers.authorization ?? '',
    )?.[1];
    if (!token) throw new UnauthorizedException('Bearer access token required');

    let payload: { sub?: unknown; exp?: unknown };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch (error) {
      if (
        error instanceof JsonWebTokenError ||
        error instanceof TokenExpiredError ||
        error instanceof NotBeforeError
      ) {
        throw new UnauthorizedException('Invalid or expired access token');
      }
      throw error;
    }

    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.sub !== 'string' ||
      !isUUID(payload.sub) ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp)
    ) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    try {
      const user = await this.users.getUserProfile(payload.sub);
      // Explicitly copy public fields: Omit<> does not remove fields at runtime.
      request.user = {
        id: user.id,
        role: user.role,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Account is no longer active');
      }
      // Database failures remain server errors, not authentication failures.
      throw error;
    }

    return true;
  }
}
