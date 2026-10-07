import { UserResponseDto } from '#app/modules/user/response/user.response';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  readonly accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  readonly tokenType = 'Bearer';

  @ApiProperty({
    example: 900,
    description: 'Access token lifetime in seconds',
  })
  readonly expiresIn: number;

  @ApiProperty({ type: UserResponseDto })
  readonly user: UserResponseDto;

  constructor(accessToken: string, expiresIn: number, user: UserResponseDto) {
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.user = user;
  }
}
