import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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
import { ConversationService } from './conversation.service.js';
import { CreateConversationRequestDto } from './request/create-conversation.dto.js';
import { ConversationResponseDto } from './response/conversation.response.js';

@ApiTags('Messaging')
@ApiBearerAuth()
@ApiExtraModels(ApiSuccessResponse, ConversationResponseDto)
@ApiUnauthorizedResponse({ type: ApiErrorResponse })
@UseGuards(AuthGuard)
@Controller('messaging/conversations')
export class MessagingController {
  constructor(private readonly conversations: ConversationService) {}

  @Post()
  @SuccessMessage('Conversation ready')
  @ApiOperation({
    summary: 'Create a conversation (AI/Direct/Channel)',
  })
  @ApiCreatedResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(ConversationResponseDto) },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateConversationRequestDto,
  ): Promise<ConversationResponseDto> {
    return this.conversations.create(request.user.id, body);
  }

  @Get(':id')
  @SuccessMessage('Conversation loaded')
  @ApiOperation({
    summary: 'Get a conversation if the current user is a member',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponse) },
        {
          properties: {
            data: { $ref: getSchemaPath(ConversationResponseDto) },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({ type: ApiErrorResponse })
  @ApiForbiddenResponse({ type: ApiErrorResponse })
  @ApiNotFoundResponse({ type: ApiErrorResponse })
  getForMember(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ConversationResponseDto> {
    return this.conversations.getForMember(id, request.user.id);
  }
}
