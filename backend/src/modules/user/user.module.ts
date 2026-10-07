import { Module } from '@nestjs/common';
import { PrismaService } from '#app/prisma/prisma.service';
import { UserRepository } from './repository/user.repository.js';
import { UsersService } from './user.service.js';

@Module({
  providers: [PrismaService, UserRepository, UsersService],
  exports: [UsersService],
})
export class UserModule {}
