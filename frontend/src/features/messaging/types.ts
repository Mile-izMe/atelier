export type ConversationType = "CHANNEL" | "DIRECT" | "AI";

export interface CreateConversationInput {
  type: ConversationType;
  channelId?: string | null;
  directId?: string;
}

export interface ConversationResponse {
  id: string;
  type: ConversationType;
  channelId: string | null;
  createdAt: string;
  updatedAt: string;
}
