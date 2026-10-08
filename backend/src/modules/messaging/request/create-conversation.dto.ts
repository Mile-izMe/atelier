import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import type { ConversationType } from '../entities/conversation.entity.js';

export class CreateConversationRequestDto {
  @ApiProperty({
    enum: ['CHANNEL', 'DIRECT', 'AI'],
    example: 'AI',
  })
  @IsIn(['CHANNEL', 'DIRECT', 'AI'])
  type!: ConversationType;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  channelId?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Other user ID; required when type is DIRECT',
  })
  @ValidateIf(
    (request: CreateConversationRequestDto) =>
      request.type === 'DIRECT' || request.directId !== undefined,
  )
  @IsUUID()
  directId?: string;
}
