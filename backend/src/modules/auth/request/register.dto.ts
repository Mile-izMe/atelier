import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'alice@example.com', maxLength: 254 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiPropertyOptional({ example: 'alice', minLength: 3, maxLength: 32 })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[A-Za-z0-9_]{3,32}$/)
  username?: string;

  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}
