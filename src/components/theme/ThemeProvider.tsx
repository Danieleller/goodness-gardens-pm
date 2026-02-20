"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { saveUserPrefs } from "@/actions/userPrefs";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return getSystemTheme();
  return theme;
}

const STORAGE_KEY = "gg-theme-preference";

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Server-fetched initial theme (avoids flash) */
  initialTheme?: Theme;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? "system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    resolveTheme(initialTheme ?? "system")
  );

  // On mount: apply theme from initialTheme or localStorage fallback
  useEffect(() => {
    if (initialTheme) {
      // Server provided the preference — trust it and cache locally
      localStorage.setItem(STORAGE_KEY, initialTheme);
      const resolved = resolveTheme(initialTheme);
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    } else {
      // No server pref — fall back to localStorage
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const initial =
        stored && ["light", "dark", "system"].includes(stored)
          ? stored
          : "system";
      setThemeState(initial);
      const resolved = resolveTheme(initial);
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    document.documentElement.setAttribute("data-theme", resolved);

    // Persist to database (fire-and-forget)
    saveUserPrefs({ theme: newTheme }).catch(() => {
      // Silently ignore — localStorage is the primary cache
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
