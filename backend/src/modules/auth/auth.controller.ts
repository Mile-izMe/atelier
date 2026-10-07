import { ApiSuccessResponse } from '#app/libs/api/api-base.response';
import { ApiErrorResponse } from '#app/libs/api/api-error.response';
import { SuccessMessage } from '#app/libs/api/success-message.decorator';
import { UserResponseDto } from '#app/modules/user/response/user.response';
import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
  ApiTags,
} from '@nestjs/swagger';
import { AuthResponseDto } from './response/auth.response.js';
import { LoginRequestDto } from './request/login.dto.js';
import { AuthService } from './auth.service.js';
import { RegisterRequestDto } from './request/register.dto.js';

@ApiTags('Auth')
@ApiExtraModels(ApiSuccessResponse, UserResponseDto, AuthResponseDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @SuccessMessage('Login successful')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        { properties: { data: { $ref: getSchemaPath(AuthResponseDto) } } },
      ],
    },
  })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiUnauthorizedResponse({ type: ApiErrorResponse })
  login(@Body() body: LoginRequestDto): Promise<AuthResponseDto> {
    return this.auth.login(body);
  }

  @Post('register')
  @SuccessMessage('Registration successful')
  @ApiOperation({ summary: 'Register a member account' })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiConflictResponse({ type: ApiErrorResponse })
  register(@Body() body: RegisterRequestDto): Promise<UserResponseDto> {
    return this.auth.register(body);
  }
}
