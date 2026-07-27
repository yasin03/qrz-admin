"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // next-themes ilk render'da server ile client'ın hangi temada olduğunu
  // bilemez (localStorage sadece client'ta okunur) — bu yüzden mount
  // olana kadar sabit bir ikon gösterip hydration mismatch'ini önlüyoruz.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      color="secondary"
      appearance="outline"
      size="icon"
      aria-label={isDark ? "Açık moda geç" : "Koyu moda geç"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-5" />
        ) : (
          <Moon className="size-5" />
        )
      ) : (
        <Moon className="size-5 opacity-0" />
      )}
    </Button>
  );
}