export default function ChatbotSidebar() {
  return (
    <aside
      id="chat-sidebar"
      aria-labelledby="chatbot-sidebar-title"
      className="flex w-48 shrink-0 flex-col border-r border-line bg-surface-muted/20 sm:w-60 lg:w-64"
    >
      <header className="border-b border-line px-4 py-5">
        <h2
          id="chatbot-sidebar-title"
          className="text-base font-semibold text-foreground"
        >
          Chatbot
        </h2>
        <p className="mt-1 text-xs text-muted">Trò chuyện cùng AI</p>
      </header>
      {/* Add the AI conversation list here. */}
    </aside>
  );
}
