/**
 * KeyboardContext — True 2D spatial keyboard navigation for Hikma.
 *
 * Up/Down (W/S) moves to the nearest element ABOVE/BELOW.
 * Left/Right (A/D) moves to the nearest element on the same row.
 * Enter/Space activates the focused element.
 */
import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { sounds } from "@/hooks/useSounds";

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
  direction: "up" | "down" | "left" | "right"
): HTMLElement | null {
  let best: { el: HTMLElement; dist: number } | null = null;

  for (const c of candidates) {
    let valid = false;
    let dist = Infinity;

    switch (direction) {
      case "down":
        // Element must be below (its top > current center Y)
        valid = c.rect.cy > current.cy + 5;
        if (valid) {
          const dy = c.rect.cy - current.cy;
          const dx = Math.abs(c.rect.cx - current.cx);
          dist = dy + dx * 0.3; // Prefer elements directly below
        }
        break;
      case "up":
        valid = c.rect.cy < current.cy - 5;
        if (valid) {
          const dy = current.cy - c.rect.cy;
          const dx = Math.abs(c.rect.cx - current.cx);
          dist = dy + dx * 0.3;
        }
        break;
      case "right":
        valid = c.rect.cx > current.cx + 5;
        if (valid) {
          const dx = c.rect.cx - current.cx;
          const dy = Math.abs(c.rect.cy - current.cy);
          dist = dx + dy * 0.3;
        }
        break;
      case "left":
        valid = c.rect.cx < current.cx - 5;
        if (valid) {
          const dx = current.cx - c.rect.cx;
          const dy = Math.abs(c.rect.cy - current.cy);
          dist = dx + dy * 0.3;
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
      const dirMap: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up", w: "up", W: "up",
        ArrowDown: "down", s: "down", S: "down",
        ArrowLeft: "left", a: "left", A: "left",
        ArrowRight: "right", d: "right", D: "right",
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
            sounds.click();
            announceElement(first);
          }
          return;
        }

        const currentRect = getRect(active);
        const candidates = focusables
          .filter(el => el !== active)
          .map(el => ({ el, rect: getRect(el) }));

        const target = findNearest(currentRect, candidates, direction);

        if (target) {
          target.focus({ preventScroll: false });
          target.scrollIntoView({ block: "nearest", behavior: "smooth" });
          sounds.click();
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
        sounds.click();
      }
    };

    const onMouseDown = () => {
      if (isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = false;
        body.removeAttribute("data-keyboard-nav");
      }
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
