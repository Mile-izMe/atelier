import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    example: 'alice@gmail.com',
    description: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'correct horse battery staple',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
