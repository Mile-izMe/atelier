export default function GuildSidebar() {
  return (
    <aside
      id="chat-sidebar"
      aria-labelledby="guild-sidebar-title"
      className="flex w-48 shrink-0 flex-col border-r border-line bg-surface-muted/20 sm:w-60 lg:w-64"
    >
      <header className="border-b border-line px-4 py-5">
        <h2
          id="guild-sidebar-title"
          className="text-base font-semibold text-foreground"
        >
          Guild
        </h2>
        <p className="mt-1 text-xs text-muted">
          Cộng đồng và các kênh trò chuyện
        </p>
      </header>
      {/* Add the guild/channel list here. */}
    </aside>
  );
}
