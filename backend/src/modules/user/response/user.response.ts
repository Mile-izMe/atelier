import { ResponseBase } from '#app/libs/api/entity.response.base';
import { ApiProperty } from '@nestjs/swagger';
import type { UserProfile, UserRole } from '../entities/user.entity.js';

export class UserResponseDto extends ResponseBase {
  @ApiProperty({ enum: ['MEMBER', 'ADMIN'] })
  readonly role: UserRole;

  @ApiProperty({ example: 'alice@example.com' })
  readonly email: string;

  @ApiProperty({ type: String, nullable: true })
  readonly username: string | null;

  constructor(user: UserProfile) {
    super(user);
    this.role = user.role;
    this.email = user.email;
    this.username = user.username;
  }
}
