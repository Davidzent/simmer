import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

/**
 * Theme state shared by every page. The inline script in each HTML entry
 * sets `data-theme` before first paint; this hook picks it up, keeps it in
 * sync on toggle, and persists the choice.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // storage unavailable (private mode) — theme still applies for the session
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
