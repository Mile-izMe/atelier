import { Injectable } from '@nestjs/common';
import { UsersService } from '#app/modules/user/user.service';
import { UserResponseDto } from '#app/modules/user/response/user.response';
import { HashService } from './service/hash.service.js';
import type { RegisterRequestDto } from './request/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly hashes: HashService,
  ) {}

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
