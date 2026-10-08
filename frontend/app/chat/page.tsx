import { ChatWorkspace } from "@/src/features";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Không gian trò chuyện | Atelier",
  description: "Guild, channels và những cuộc trò chuyện của bạn.",
};

export default function Page() {
  return <ChatWorkspace />;
}
