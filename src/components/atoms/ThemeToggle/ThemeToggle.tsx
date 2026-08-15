import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { cn } from "../../../lib/cn";

type Theme = "light" | "dark";
const THEME_STORAGE_KEY = "jobuddy:theme";

type ThemeContextValue = { theme: Theme; toggle: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Use the light default when browser storage is unavailable.
  }
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme remains available for the current session when storage is blocked.
    }
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let hasStoredTheme = false;
      try {
        hasStoredTheme = window.localStorage.getItem(THEME_STORAGE_KEY) !== null;
      } catch {
        // Fall back to the current in-memory theme when storage is blocked.
      }
      if (!hasStoredTheme) {
        setTheme(media.matches ? "dark" : "light");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    if ("startViewTransition" in document && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--theme-origin", "100% 0%");
      root.dataset.themeTransition = "circle-blur";
      const transition = (document as Document & { startViewTransition: (callback: () => void) => { finished: Promise<void> } }).startViewTransition(() => setTheme(next));
      transition.finished.finally(() => delete root.dataset.themeTransition);
    } else {
      setTheme(next);
    }
  };

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function ThemeToggle({ className }: { className?: string }) {
  const context = useContext(ThemeContext);
  const reduce = useReducedMotion() ?? false;
  if (!context) throw new Error("ThemeToggle must be rendered inside ThemeProvider");
  const isDark = context.theme === "dark";

  return (
    <motion.button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={context.toggle}
      whileTap={reduce ? undefined : { scale: 0.9 }}
      className={cn("grid size-9 place-items-center rounded-full border border-line bg-surface/80 text-ink shadow-sm backdrop-blur-md transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={isDark ? "sun" : "moon"} initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -45, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 45, scale: 0.7 }} transition={{ duration: 0.18 }}>
          {isDark ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
