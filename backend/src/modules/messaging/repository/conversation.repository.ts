import { BaseRepository } from '#app/libs/database/base.repository';
import { isUniqueConstraintError } from '#app/libs/database/is-unique-constraint-error';
import { PrismaService } from '#app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import type {
  ConversationEntity,
  CreateConversationInput,
  UpdateConversationInput,
} from '../entities/conversation.entity.js';

@Injectable()
export class ConversationRepository extends BaseRepository<
  ConversationEntity,
  CreateConversationInput,
  UpdateConversationInput
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.orm.public.Conversation);
  }

  createAiForUser(userId: string): Promise<ConversationEntity> {
    // Prisma's nested create writes the conversation and its member atomically.
    return this.prisma.orm.public.Conversation.create({
      type: 'AI',
      channelId: null,
      directKey: null,
      createdBy: userId,
      members: (members) => members.create([{ userId }]),
    });
  }

  findDirectByKey(directKey: string): Promise<ConversationEntity | null> {
    return this.prisma.orm.public.Conversation.where({
      type: 'DIRECT',
      directKey,
    }).first();
  }

  async getOrCreateDirect(
    userId: string,
    directId: string,
    directKey: string,
  ): Promise<ConversationEntity> {
    const existing = await this.findDirectByKey(directKey);
    if (existing) return existing;

    try {
      return await this.prisma.transaction(async (tx) => {
        const conversation = await tx.orm.public.Conversation.create({
          type: 'DIRECT',
          channelId: null,
          directKey,
          createdBy: userId,
        });

        await tx.orm.public.ConversationMember.create({
          conversationId: conversation.id,
          userId,
        });
        await tx.orm.public.ConversationMember.create({
          conversationId: conversation.id,
          userId: directId,
        });

        return conversation;
      });
    } catch (error) {
      if (!isUniqueConstraintError(error, 'conversations_direct_key_key')) {
        throw error;
      }

      // Another request may win the same pair. Reload after our transaction rolls back.
      const winner = await this.findDirectByKey(directKey);
      if (!winner) throw error;
      return winner;
    }
  }

  async hasMember(conversationId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.orm.public.ConversationMember.where({
      conversationId,
      userId,
    }).first();
    return member !== null;
  }
}
