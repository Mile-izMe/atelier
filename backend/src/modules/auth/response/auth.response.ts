import { UserResponseDto } from '#app/modules/user/response/user.response';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({
    example: 900,
    description: 'Access token lifetime in seconds',
  })
  expiresIn!: number;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
