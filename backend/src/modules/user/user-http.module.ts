import { Module } from '@nestjs/common';
import { AuthModule } from '#app/modules/auth/auth.module';
import { UserModule } from './user.module.js';
import { UserController } from './user.controller.js';

// Keep HTTP routes separate so UserModule and AuthModule do not import each other.
@Module({
  imports: [AuthModule, UserModule],
  controllers: [UserController],
})
export class UserHttpModule {}
