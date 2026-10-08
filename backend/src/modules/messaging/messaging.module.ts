import { Module } from '@nestjs/common';
import { AuthModule } from '#app/modules/auth/auth.module';
import { MessagingController } from './messaging.controller.js';
import { PrismaModule } from '#app/prisma/prisma.module';
import { UserModule } from '#app/modules/user/user.module';
import { ConversationRepository } from './repository/conversation.repository.js';
import { ConversationService } from './conversation.service.js';

@Module({
  imports: [PrismaModule, UserModule, AuthModule],
  controllers: [MessagingController],
  providers: [ConversationRepository, ConversationService],
  exports: [ConversationService],
})
export class MessagingModule {}
