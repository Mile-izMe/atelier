import { Bot, Plus } from "lucide-react";
import type { ChatSection } from "../types";
import AtelierIcon from "./AtelierIcon";

interface ChatRailProps {
  activeSection: ChatSection;
  onSelect: (section: ChatSection) => void;
}

function ChatRail({ activeSection, onSelect }: ChatRailProps) {
  const buttonClass = (section: ChatSection) =>
    `group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-action sm:h-12 sm:w-12 ${
      activeSection === section
        ? "rounded-2xl border-action bg-action text-action-foreground"
        : "rounded-[22px] border-line bg-surface text-muted hover:rounded-2xl hover:border-action hover:text-foreground"
    }`;

  const indicator = (section: ChatSection) => (
    <span
      aria-hidden
      className={`absolute -left-3.5 w-1 rounded-r-full bg-action transition-all duration-200 sm:-left-4 ${
        activeSection === section
          ? "h-7 opacity-100"
          : "h-2 opacity-0 group-hover:h-4 group-hover:opacity-100"
      }`}
    />
  );

  return (
    <nav
      aria-label="Điều hướng trò chuyện"
      className="flex w-[72px] shrink-0 flex-col items-center gap-3 overflow-y-auto border-r border-line bg-surface-muted/50 py-5 sm:w-20"
    >
      <button
        type="button"
        title="Atelier"
        aria-label="Atelier"
        aria-controls="chat-sidebar"
        aria-pressed={activeSection === "atelier"}
        onClick={() => onSelect("atelier")}
        className={buttonClass("atelier")}
      >
        {indicator("atelier")}
        <AtelierIcon className="h-7 w-7" />
      </button>

      <button
        type="button"
        title="Chatbot"
        aria-label="Chatbot"
        aria-controls="chat-sidebar"
        aria-pressed={activeSection === "chatbot"}
        onClick={() => onSelect("chatbot")}
        className={buttonClass("chatbot")}
      >
        {indicator("chatbot")}
        <Bot className="h-6 w-6" aria-hidden />
      </button>

      <hr className="my-1 w-8 shrink-0 border-0 border-t border-line" />

      {/* {guilds.map((guild) => (
        <button
          key={guild.id}
          title={guild.name}
          aria-label={`Mở guild ${guild.name}`}
          aria-pressed={guild.id === activeId}
          onClick={() => onSelect(guild.id)}
          className={`cursor-pointer flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold transition sm:h-11 sm:w-11 ${guild.id === activeId ? "border-action bg-action text-action-foreground" : "border-line bg-surface text-muted hover:border-accent hover:text-foreground"}`}
        >
          {initials(guild.name)}
        </button>
      ))} */}
      <button
        // onClick={onCreate}
        aria-label="Tạo guild"
        title="Tạo guild"
        className="cursor-pointer flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-dashed border-line text-muted transition hover:border-accent hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
      </button>
    </nav>
  );
}

export default ChatRail;
