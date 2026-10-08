import { Module } from '@nestjs/common';
import { PrismaModule } from '#app/prisma/prisma.module';
import { UserRepository } from './repository/user.repository.js';
import { UsersService } from './user.service.js';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository, UsersService],
  exports: [UsersService],
})
export class UserModule {}
