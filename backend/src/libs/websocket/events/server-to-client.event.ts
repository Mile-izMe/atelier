export interface ChatErrorDetail {
  code: string;
  message: string | string[];
}

export interface ServerToClientEvents {
  pong: (data: { message: string; roomPrefix: string }) => void;

  'chat.error': (response: { success: false; error: ChatErrorDetail }) => void;
}
