import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '#app/modules/user/user.module';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { createJwtOptions } from './jwt.config.js';
import { HashService } from './service/hash.service.js';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({ useFactory: createJwtOptions }),
  ],
  controllers: [AuthController],
  providers: [AuthService, HashService],
})
export class AuthModule {}
