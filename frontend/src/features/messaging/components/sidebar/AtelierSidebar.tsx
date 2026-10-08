export default function AtelierSidebar() {
  return (
    <aside
      id="chat-sidebar"
      aria-labelledby="atelier-sidebar-title"
      className="flex w-48 shrink-0 flex-col border-r border-line bg-surface-muted/20 sm:w-60 lg:w-64"
    >
      <header className="border-b border-line px-4 py-5">
        <h2
          id="atelier-sidebar-title"
          className="text-base font-semibold text-foreground"
        >
          Atelier
        </h2>
        <p className="mt-1 text-xs text-muted">Không gian trò chuyện của bạn</p>
      </header>
      {/* Add the home/direct conversation list here. */}
    </aside>
  );
}
