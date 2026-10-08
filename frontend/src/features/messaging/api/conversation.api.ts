import { requestData } from "@/src/shared/lib/api";
import type { ConversationResponse, CreateConversationInput } from "../types";

export const conversationApi = {
  create: (data: CreateConversationInput): Promise<ConversationResponse> =>
    requestData<ConversationResponse>({
      method: "POST",
      url: "/messaging/conversations",
      requiresAuth: true,
      data,
    }),

  get: (id: string): Promise<ConversationResponse> =>
    requestData<ConversationResponse>({
      method: "GET",
      url: `/messaging/conversations/${encodeURIComponent(id)}`,
      requiresAuth: true,
    }),
};
