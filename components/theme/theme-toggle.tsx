"use client";

import { MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function getCurrentTheme(): Theme {
  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem("theme", theme);
}

export function ThemeToggle() {
  function toggleTheme() {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle light and dark mode" className="px-2">
      <MoonStar className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Theme</span>
    </Button>
  );
}
