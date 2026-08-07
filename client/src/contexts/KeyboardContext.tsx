/**
 * KeyboardContext — True 2D spatial keyboard navigation for Hikma.
 *
 * Up/Down (W/S) moves to the nearest element ABOVE/BELOW.
 * Left/Right (A/D) moves to the nearest element on the same row.
 * Enter/Space activates the focused element.
 */
import { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from "react";
import { playSound } from "@/lib/sound";
import { toast } from "sonner";

interface KeyboardContextValue {
  isKeyboardActive: boolean;
}

const KeyboardContext = createContext<KeyboardContextValue>({ isKeyboardActive: false });

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']:not([disabled])",
  "[role='link']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
].join(",");

/** Two elements share a row if their vertical spans overlap by at least half
 *  the height of the shorter one. Tolerant of differing element heights. */
function sameRow(a: Rect, b: Rect): boolean {
  const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (overlap <= 0) return false;
  const shorter = Math.min(a.bottom - a.top, b.bottom - b.top);
  return overlap >= shorter * 0.5;
}

/** Module-level sticky column memory — set on Left/Right, used by Up/Down, cleared on mouse/route */
let desiredCx: number | null = null;

interface Rect { top: number; left: number; bottom: number; right: number; cx: number; cy: number; }

function getRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, bottom: r.bottom, right: r.right, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

function getVisibleFocusables(): HTMLElement[] {
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return all.filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top < window.innerHeight + 200 && r.bottom > -200;
  });
}

function shouldPassThrough(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase();
  const role = el.getAttribute("role");
  return (
    tag === "input" || tag === "textarea" || tag === "select" ||
    type === "range" || type === "number" ||
    role === "slider" || role === "spinbutton" || role === "listbox" || role === "combobox" ||
    el.closest('[role="listbox"]') !== null || el.closest('[role="combobox"]') !== null
  );
}

/** Find the best candidate in a given direction using spatial proximity */
function findNearest(
  current: Rect,
  candidates: { el: HTMLElement; rect: Rect }[],
  direction: "up" | "down" | "left" | "right",
  desiredColumn?: number | null
): HTMLElement | null {
  let best: { el: HTMLElement; dist: number } | null = null;

  for (const c of candidates) {
    let valid = false;
    let dist = Infinity;

    switch (direction) {
      case "down":
        // Must be in a DIFFERENT row below current
        valid = !sameRow(current, c.rect) && c.rect.cy > current.cy;
        if (valid) {
          const dy = c.rect.cy - current.cy;
          // Use desiredCx (sticky column) if available, else current cx
          const refCx = desiredColumn ?? current.cx;
          const dx = Math.abs(c.rect.cx - refCx);
          dist = dy + dx * 1.5; // Nearest row first, then nearest column
        }
        break;
      case "up":
        // Must be in a DIFFERENT row above current
        valid = !sameRow(current, c.rect) && c.rect.cy < current.cy;
        if (valid) {
          const dy = current.cy - c.rect.cy;
          const refCx = desiredColumn ?? current.cx;
          const dx = Math.abs(c.rect.cx - refCx);
          dist = dy + dx * 1.5;
        }
        break;
      case "right":
        // Must be in the SAME row, and start at or after current element's right edge
        valid = sameRow(current, c.rect) && c.rect.left >= current.right - 2;
        if (valid) {
          // Score by horizontal gap only — within a row dy is noise
          dist = Math.abs(c.rect.cx - current.cx);
        }
        break;
      case "left":
        // Must be in the SAME row, and end at or before current element's left edge
        valid = sameRow(current, c.rect) && c.rect.right <= current.left + 2;
        if (valid) {
          dist = Math.abs(c.rect.cx - current.cx);
        }
        break;
    }

    if (valid && dist < (best?.dist ?? Infinity)) {
      best = { el: c.el, dist };
    }
  }

  return best?.el ?? null;
}

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const isKeyboardActiveRef = useRef(false);

  useEffect(() => {
    const body = document.body;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = true;
        body.setAttribute("data-keyboard-nav", "true");
      }

      const active = document.activeElement as HTMLElement | null;
      if (shouldPassThrough(active)) return;

      const key = e.key;

      // ── Global back shortcut: Ctrl+B / Alt+ArrowLeft / Ctrl+[ ──────────────
      const isCtrl = e.ctrlKey || e.metaKey;
      if (
        (isCtrl && key === "b") ||
        (isCtrl && key === "[") ||
        (e.altKey && key === "ArrowLeft")
      ) {
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
          playSound("navigate");
          toast.info("Going back…", { id: "go-back", duration: 1500 });
        }
        return;
      }

      // Detect if user is typing in a text field — don't hijack W/A/S/D
      const isTextContext = active && (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        (active as HTMLElement).getAttribute("contenteditable") === "true" ||
        active.closest('[role="textbox"]') !== null ||
        active.closest('[role="searchbox"]') !== null
      );
      const dirMap: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        ...(isTextContext ? {} : {
          w: "up", W: "up",
          s: "down", S: "down",
          a: "left", A: "left",
          d: "right", D: "right",
        }),
      };

      const direction = dirMap[key];
      const isActivate = key === "Enter" || key === " ";

      if (direction) {
        e.preventDefault();
        const focusables = getVisibleFocusables();
        if (focusables.length === 0) return;

        // If nothing is focused, focus the first element
        if (!active || active === document.body || !focusables.includes(active)) {
          const first = focusables[0];
          if (first) {
            first.focus({ preventScroll: false });
            first.scrollIntoView({ block: "nearest", behavior: "smooth" });
            playSound("tap");
            announceElement(first);
          }
          return;
        }

        const currentRect = getRect(active);
        const candidates = focusables
          .filter(el => el !== active)
          .map(el => ({ el, rect: getRect(el) }));

        const target = findNearest(currentRect, candidates, direction, desiredCx);

        // Update sticky column on horizontal moves; leave unchanged on vertical
        if (target) {
          if (direction === "left" || direction === "right") {
            desiredCx = getRect(target).cx;
          }
          // On up/down, desiredCx stays so Down-then-Up returns to original column
        }

        if (target) {
          target.focus({ preventScroll: false });
          target.scrollIntoView({ block: "nearest", behavior: "smooth" });
          playSound("tap");
          announceElement(target);
        }
        return;
      }

      if (isActivate && active && active !== document.body) {
        const tag = active.tagName.toLowerCase();
        const role = active.getAttribute("role");
        // Don't double-fire on native interactive elements
        if (tag === "button" || tag === "a" || role === "button" || role === "link") return;
        e.preventDefault();
        active.click();
        playSound("tap");
      }
    };

    const onMouseDown = () => {
      if (isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = false;
        body.removeAttribute("data-keyboard-nav");
      }
      // Clear sticky column on mouse interaction
      desiredCx = null;
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("mousedown", onMouseDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("mousedown", onMouseDown, true);
    };
  }, []);

  return (
    <KeyboardContext.Provider value={{ isKeyboardActive: isKeyboardActiveRef.current }}>
      {children}
    </KeyboardContext.Provider>
  );
}

function announceElement(el: HTMLElement) {
  const label =
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    el.textContent?.trim().slice(0, 80) ||
    el.tagName.toLowerCase();
  window.dispatchEvent(new CustomEvent("hikma:focus-announce", { detail: { label } }));
}

export function useKeyboard() {
  return useContext(KeyboardContext);
}
