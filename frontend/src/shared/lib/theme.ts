export const THEME_KEY = "atelier.theme";
export type Theme = "light" | "dark";

export function readTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

// Runs in the document head before paint; contains no user-provided data.
export const themeScript = `(() => {
  let theme;
  try { theme = localStorage.getItem('${THEME_KEY}'); } catch {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();`;
