"use client";

import { useState, useEffect, useCallback } from "react";
import { CommandPalette } from "./CommandPalette";
import { HeidiHintBubble } from "./HeidiHintBubble";

/* ═══════════════════════════════════════════════════
   OverlayProvider — Global overlay mount point
   Renders CommandPalette (⌘K) and HeidiHintBubble
   at the root level so they're available on every page.
   ═══════════════════════════════════════════════════ */

interface OverlayProviderProps {
  children: React.ReactNode;
}

export function OverlayProvider({ children }: OverlayProviderProps) {
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  /* ── Global ⌘K / Ctrl+K listener ── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClosePalette = useCallback(() => {
    setCmdPaletteOpen(false);
  }, []);

  return (
    <>
      {children}

      {/* ── Command Palette (⌘K) ── */}
      <CommandPalette open={cmdPaletteOpen} onClose={handleClosePalette} />

      {/* ── Heidi Hint Bubble (bottom-right) ── */}
      <HeidiHintBubble />
    </>
  );
}
