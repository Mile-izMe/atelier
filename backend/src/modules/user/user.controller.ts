import { Controller, Get, Header, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from '#app/libs/api/api-base.response';
import { ApiErrorResponse } from '#app/libs/api/api-error.response';
import { SuccessMessage } from '#app/libs/api/success-message.decorator';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '#app/modules/auth/guards/auth.guard';
import { UserResponseDto } from './response/user.response.js';

@ApiTags('Users')
@ApiBearerAuth()
@ApiExtraModels(ApiSuccessResponse, UserResponseDto)
@ApiUnauthorizedResponse({ type: ApiErrorResponse })
@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
  @Get('me')
  @Header('Cache-Control', 'no-store')
  @SuccessMessage('Profile loaded')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        { properties: { data: { $ref: getSchemaPath(UserResponseDto) } } },
      ],
    },
  })
  getProfile(@Req() request: AuthenticatedRequest): UserResponseDto {
    // AuthGuard already loaded the current active user from the database.
    return new UserResponseDto(request.user);
  }
}
