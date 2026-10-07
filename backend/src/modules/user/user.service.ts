import { Injectable } from '@nestjs/common';
import { AppException } from '#app/libs/exceptions/app.exception';
import { ErrorCode } from '#app/libs/exceptions/error-code';
import type { CreateUserInput, UserEntity } from './entities/user.entity.js';
import { EmailAlreadyExistsError } from './errors/email-already-exists.error.js';
import { UserRepository } from './repository/user.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  async ensureEmailAvailable(email: string): Promise<void> {
    if (await this.users.findByEmail(email)) {
      throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
  }

  async create(input: CreateUserInput): Promise<UserEntity> {
    try {
      // Explicit fields prevent callers from setting role/id through extra properties.
      return await this.users.create({
        email: input.email.trim().toLowerCase(),
        passwordHash: input.passwordHash,
        username: input.username ?? null,
      });
    } catch (error) {
      // The unique constraint also protects concurrent registrations.
      if (error instanceof EmailAlreadyExistsError) {
        throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
      }
      throw error;
    }
  }
}
