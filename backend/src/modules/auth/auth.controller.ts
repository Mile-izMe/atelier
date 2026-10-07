import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from '#app/libs/api/api-base.response';
import { ApiErrorResponse } from '#app/libs/api/api-error.response';
import { SuccessMessage } from '#app/libs/api/success-message.decorator';
import { UserResponseDto } from '#app/modules/user/response/user.response';
import { AuthService } from './auth.service.js';
import { RegisterRequestDto } from './request/register.dto.js';

@ApiTags('Auth')
@ApiExtraModels(ApiSuccessResponse, UserResponseDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @SuccessMessage('Registration successful')
  @ApiOperation({ summary: 'Register a member account' })
  @ApiCreatedResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: { data: { $ref: getSchemaPath(UserResponseDto) } },
        },
      ],
    },
  })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiConflictResponse({ type: ApiErrorResponse })
  register(@Body() body: RegisterRequestDto): Promise<UserResponseDto> {
    return this.auth.register(body);
  }
}
