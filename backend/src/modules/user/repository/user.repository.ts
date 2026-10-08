import { BaseRepository } from '#app/libs/database/base.repository';
import { isUniqueConstraintError } from '#app/libs/database/is-unique-constraint-error';
import { PrismaService } from '#app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserEntity,
} from '../entities/user.entity.js';
import { EmailAlreadyExistsError } from '../errors/email-already-exists.error.js';

@Injectable()
export class UserRepository extends BaseRepository<
  UserEntity,
  CreateUserInput,
  UpdateUserInput
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.orm.public.User);
  }

  findActiveById(id: string): Promise<UserEntity | null> {
    return this.prisma.orm.public.User.where({
      id,
      deletedAt: null,
    }).first();
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    // Include soft-deleted users: the email is still reserved by the unique constraint.
    return this.prisma.orm.public.User.where({ email }).first();
  }

  override async create(data: CreateUserInput): Promise<UserEntity> {
    try {
      return await super.create(data);
    } catch (error) {
      if (isUniqueConstraintError(error, 'users_email_key')) {
        throw new EmailAlreadyExistsError(error);
      }
      throw error;
    }
  }
}
