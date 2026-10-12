"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Theme = "light" | "dark";
const THEME_KEY = "ouramrita-theme";
const THEME_CHANGE_EVENT = "ouramrita-theme-change";

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: "light",
  setTheme: () => {},
});

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeToTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = (event: MediaQueryListEvent) => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") return;
    } catch (error) {
      console.warn("Could not read the saved theme preference.", error);
    }
    document.documentElement.dataset.theme = event.matches ? "dark" : "light";
    onChange();
  };
  const onStorageChange = (event: StorageEvent) => {
    if (event.key !== THEME_KEY) return;
    document.documentElement.dataset.theme =
      event.newValue === "dark" || event.newValue === "light"
        ? event.newValue
        : media.matches ? "dark" : "light";
    onChange();
  };
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorageChange);
  media.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorageChange);
    media.removeEventListener("change", onSystemChange);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "light" as const);
  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  const toast = useToast();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const Icon = nextTheme === "dark" ? Moon : Sun;

  function changeTheme() {
    setTheme(nextTheme);
    try {
      window.localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      toast({ tone: "error", message: "Theme changed for this visit, but could not be saved on this device." });
    }
  }

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      onClick={changeTheme}
      className="inline-flex min-h-11 items-center gap-2 rounded-control border border-on-accent px-3 py-2 font-medium text-on-accent hover:bg-accent-hover"
    >
      <Icon size={18} aria-hidden="true" />
      <span className="hidden sm:inline">{nextTheme === "dark" ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
