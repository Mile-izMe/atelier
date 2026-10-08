import type { Models } from '../../../prisma/contract.js';

// Scalar fields returned for a conversation; relations are loaded separately.
export type ConversationEntity = Pick<
  Models.public_Conversation,
  'id' | 'channelId' | 'directKey' | 'type' | 'createdAt' | 'updatedAt'
>;

export type ConversationType = ConversationEntity['type'];

export type CreateConversationInput = Pick<ConversationEntity, 'type'> &
  Partial<Pick<ConversationEntity, 'channelId' | 'directKey'>>;

export type UpdateConversationInput = Partial<
  Pick<ConversationEntity, 'channelId' | 'directKey'>
>;

// The internal key used to deduplicate direct chats is not part of the API.
export type ConversationData = Omit<ConversationEntity, 'directKey'>;
