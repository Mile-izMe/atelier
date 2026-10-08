"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, readTheme, THEME_KEY } from "@/src/shared/lib/theme";

export default function ThemeToggle() {
  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () =>
      applyTheme(readTheme() ?? (system.matches ? "dark" : "light"));
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null) syncTheme();
    };
    system.addEventListener("change", syncTheme);
    window.addEventListener("storage", onStorage);
    return () => {
      system.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function toggle() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* Current tab still works. */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Chuyển chế độ sáng/tối"
      title="Chuyển chế độ sáng/tối"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <Moon aria-hidden className="h-4 w-4 dark:hidden" />
      <Sun aria-hidden className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
