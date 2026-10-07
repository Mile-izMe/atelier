import 'dotenv/config';
import type { JwtModuleOptions } from '@nestjs/jwt';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export function createJwtOptions(): JwtModuleOptions {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }

  return {
    secret,
    signOptions: {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
    verifyOptions: { algorithms: ['HS256'] },
  };
}
