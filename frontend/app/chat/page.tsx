import type { Metadata } from "next";
import { ChatPage } from "@/src/features/chat/components/ChatPage";

export const metadata: Metadata = {
  title: "Không gian trò chuyện | Atelier",
  description: "Guild, channels và những cuộc trò chuyện của bạn.",
};

export default function Page() {
  return <ChatPage />;
}
