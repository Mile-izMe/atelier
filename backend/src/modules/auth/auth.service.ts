import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '#app/libs/exceptions/app.exception';
import { ErrorCode } from '#app/libs/exceptions/error-code';
import type { LoginRequestDto } from './request/login.dto.js';
import { AuthResponseDto } from './response/auth.response.js';
import { ACCESS_TOKEN_TTL_SECONDS } from './jwt.config.js';
import { UsersService } from '#app/modules/user/user.service';
import { UserResponseDto } from '#app/modules/user/response/user.response';
import { HashService } from './service/hash.service.js';
import type { RegisterRequestDto } from './request/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly hashes: HashService,
    private readonly jwt: JwtService,
  ) {}

  async login(request: LoginRequestDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(request.email);

    if (!user || user.deletedAt !== null) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    const passwordMatches = await this.hashes.verify(
      user.passwordHash,
      request.password,
    );
    if (!passwordMatches) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return new AuthResponseDto(
      accessToken,
      ACCESS_TOKEN_TTL_SECONDS,
      new UserResponseDto(user),
    );
  }

  async register(request: RegisterRequestDto): Promise<UserResponseDto> {
    const email = request.email.trim().toLowerCase();
    await this.users.ensureEmailAvailable(email);

    const passwordHash = await this.hashes.hash(request.password);
    const user = await this.users.create({
      email,
      passwordHash,
      username: request.username,
    });

    // Allowlist public fields; never return the database row directly.
    return new UserResponseDto(user);
  }
}
