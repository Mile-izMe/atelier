import { Module } from '@nestjs/common';
import { UserModule } from '#app/modules/user/user.module';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { HashService } from './service/hash.service.js';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, HashService],
})
export class AuthModule {}
