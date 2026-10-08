import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '#app/modules/user/user.service';
import type { CreateConversationRequestDto } from './request/create-conversation.dto.js';
import { ConversationRepository } from './repository/conversation.repository.js';
import { ConversationResponseDto } from './response/conversation.response.js';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly users: UsersService,
  ) {}

  async create(
    userId: string,
    request: CreateConversationRequestDto,
  ): Promise<ConversationResponseDto> {
    // CHANNEL creation needs its own guild/channel authorization rules.
    if (request.type === 'CHANNEL') {
      throw new BadRequestException(
        'Channel conversation creation is not implemented yet',
      );
    }
    if (request.channelId != null) {
      throw new BadRequestException(
        'AI and DIRECT conversations cannot have a channelId',
      );
    }

    if (request.type === 'AI') {
      if (request.directId !== undefined) {
        throw new BadRequestException(
          'AI conversations cannot have a directId',
        );
      }
      const conversation = await this.conversations.createAiForUser(userId);
      return new ConversationResponseDto(conversation);
    }

    if (request.type === 'DIRECT') {
      if (!request.directId) {
        throw new BadRequestException(
          'directId is required for DIRECT conversations',
        );
      }

      const currentUserId = userId.toLowerCase();
      const directId = request.directId.toLowerCase();
      if (currentUserId === directId) {
        throw new BadRequestException(
          'Cannot create a direct conversation with yourself',
        );
      }
      await this.users.getUserProfile(directId);

      // Both A -> B and B -> A produce the same key.
      const directKey = [currentUserId, directId].sort().join(':');
      const conversation = await this.conversations.getOrCreateDirect(
        currentUserId,
        directId,
        directKey,
      );
      return new ConversationResponseDto(conversation);
    }

    throw new BadRequestException('Invalid conversation type');
  }

  async getForMember(
    conversationId: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (!(await this.conversations.hasMember(conversationId, userId))) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    return new ConversationResponseDto(conversation);
  }
}
