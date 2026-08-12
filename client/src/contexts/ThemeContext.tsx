import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  switchable = false,
}: ThemeProviderProps) {
  const getDeviceTheme = (): Theme => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      try {
        const stored = localStorage.getItem("theme");
        if (stored === "light" || stored === "dark") return stored;
      } catch {}
    }
    return defaultTheme === "system" ? getDeviceTheme() : defaultTheme;
  });

  useEffect(() => {
    if (switchable || defaultTheme !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [defaultTheme, switchable]);

  useEffect(() => {
    const root = document.documentElement;
    const profileTheme = root.getAttribute("data-theme");
    // Non-light profile themes (calm, cream, high contrast) are explicit learner choices.
    if (profileTheme && profileTheme !== "light" && theme !== "dark") return;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) try { localStorage.setItem("theme", theme); } catch {}
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
