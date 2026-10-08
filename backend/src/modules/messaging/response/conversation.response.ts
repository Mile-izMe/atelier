import { ResponseBase } from '#app/libs/api/entity.response.base';
import { ApiProperty } from '@nestjs/swagger';
import type {
  ConversationData,
  ConversationType,
} from '../entities/conversation.entity.js';

export class ConversationResponseDto extends ResponseBase {
  @ApiProperty({ enum: ['CHANNEL', 'DIRECT', 'AI'] })
  readonly type: ConversationType;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  readonly channelId: string | null;

  constructor(conversation: ConversationData) {
    super(conversation);
    // Explicit assignment controls the actual JSON fields returned to clients.
    this.type = conversation.type;
    this.channelId = conversation.channelId;
  }
}
