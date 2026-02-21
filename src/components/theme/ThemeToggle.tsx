"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      role="radiogroup"
      aria-label="Theme"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className="p-1.5 rounded-md transition-all duration-150"
          style={{
            background: theme === value ? "var(--surface-1)" : "transparent",
            color: theme === value ? "var(--text)" : "var(--text-3)",
            boxShadow: theme === value ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
          }}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
