"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, X } from "lucide-react";

/* ═══════════════════════════════════════════════
   HeidiHintBubble — Floating AI hint bubble
   Shows one daily tip with "Got it" / "Show me".
   Persists state to localStorage (Turso later).
   ═══════════════════════════════════════════════ */

const STORAGE_KEY = "gg-heidi-state";

interface HeidiState {
  tipsEnabled: boolean;
  lastTipDate: string;
  lastTipId: number;
}

const TIPS = [
  { id: 0, text: "Press ⌘K to jump to any project.", highlight: "[data-cmd-k]" },
  { id: 1, text: 'Use "Blocked" when you\'re waiting on someone — Heidi can nudge.', highlight: null },
  { id: 2, text: "Keep descriptions short; use checklists for steps.", highlight: null },
  { id: 3, text: "Filter Overdue every Friday to clear the board.", highlight: "[data-filter-overdue]" },
  { id: 4, text: "Click any task row to open the detail drawer.", highlight: null },
  { id: 5, text: "Use the Team view to see everyone\'s workload at a glance.", highlight: "[data-nav-team]" },
];

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function loadState(): HeidiState {
  if (typeof window === "undefined") {
    return { tipsEnabled: true, lastTipDate: "", lastTipId: -1 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { tipsEnabled: true, lastTipDate: "", lastTipId: -1 };
}

function saveState(state: HeidiState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function HeidiHintBubble() {
  const [state, setState] = useState<HeidiState>(loadState);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* ── Determine today's tip ── */
  const today = getToday();
  const nextTipId = (state.lastTipId + 1) % TIPS.length;
  const currentTip = TIPS[nextTipId];
  const isNewDay = state.lastTipDate !== today;
  const shouldShowTip = state.tipsEnabled && isNewDay && !dismissed;

  /* ── Auto-expand on new day ── */
  useEffect(() => {
    if (shouldShowTip) {
      const timer = setTimeout(() => setExpanded(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [shouldShowTip]);

  /* ── Handlers ── */
  const handleGotIt = useCallback(() => {
    const newState: HeidiState = {
      ...state,
      lastTipDate: today,
      lastTipId: nextTipId,
    };
    setState(newState);
    saveState(newState);
    setExpanded(false);
    setDismissed(true);
  }, [state, today, nextTipId]);

  const handleShowMe = useCallback(() => {
    if (currentTip.highlight) {
      const el = document.querySelector(currentTip.highlight);
      if (el) {
        el.classList.add("heidi-highlight");
        setTimeout(() => el.classList.remove("heidi-highlight"), 3000);
      }
    }
    handleGotIt();
  }, [currentTip, handleGotIt]);

  const handleDisableTips = useCallback(() => {
    const newState: HeidiState = {
      ...state,
      tipsEnabled: false,
      lastTipDate: today,
      lastTipId: nextTipId,
    };
    setState(newState);
    saveState(newState);
    setExpanded(false);
    setDismissed(true);
  }, [state, today, nextTipId]);

  const toggleBubble = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div className="fixed bottom-6 right-6" style={{ zIndex: 90 }}>
      {/* ── Expanded glass card ── */}
      {expanded && (
        <div
          className="glass-overlay absolute bottom-14 right-0 w-72 rounded-xl p-4 mb-2 animate-in"
          style={{ zIndex: 91 }}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-2 right-2 p-1 rounded-md transition-colors"
            style={{ color: "var(--text-3)" }}
            aria-label="Close tip"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <p className="text-sm mb-3 pr-5" style={{ color: "var(--text)" }}>
            {currentTip.text}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShowMe}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
              style={{ background: "var(--accent)" }}
            >
              {currentTip.highlight ? "Show me" : "Got it"}
            </button>
            {currentTip.highlight && (
              <button
                onClick={handleGotIt}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ color: "var(--text-2)", background: "var(--surface-2)" }}
              >
                Got it
              </button>
            )}
          </div>

          <button
            onClick={handleDisableTips}
            className="mt-2 text-[11px] underline transition-colors"
            style={{ color: "var(--text-3)" }}
          >
            Don&apos;t show again
          </button>
        </div>
      )}

      {/* ── Floating button ── */}
      <button
        onClick={toggleBubble}
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
        style={{ background: "var(--accent)", color: "white" }}
        aria-label="Heidi assistant"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* ── Pulse indicator when tip is available ── */}
      {shouldShowTip && !expanded && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full animate-pulse"
          style={{ background: "var(--accent)" }}
        />
      )}
    </div>
  );
}
