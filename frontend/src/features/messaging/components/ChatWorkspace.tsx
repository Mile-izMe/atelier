"use client";

import { useState } from "react";
import type { ChatSection } from "../types";
import ChatRail from "./ChatRail";
import { AtelierSidebar, ChatbotSidebar, GuildSidebar } from "./sidebar";

const sidebars = {
  atelier: AtelierSidebar,
  chatbot: ChatbotSidebar,
  guild: GuildSidebar,
};

function ChatWorkspace() {
  const [activeSection, setActiveSection] = useState<ChatSection>("atelier");
  const ActiveSidebar = sidebars[activeSection];

  return (
    <main className="mx-auto w-full max-w-370 p-2 sm:p-4">
      <div className="relative flex h-[calc(100dvh-164px)] min-h-130 overflow-hidden rounded-2xl border border-line bg-surface lg:h-[calc(100dvh-112px)] lg:rounded-3xl">
        <ChatRail activeSection={activeSection} onSelect={setActiveSection} />
        <ActiveSidebar />
        <section
          aria-label="Nội dung cuộc trò chuyện"
          className="min-w-0 flex-1"
        />
      </div>
    </main>
  );
}

export default ChatWorkspace;
