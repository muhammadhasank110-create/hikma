/**
 * KeyboardContext — Professional keyboard navigation for Hikma.
 *
 * Design principles (based on WCAG 2.2, APG patterns, Duolingo/Khan Academy):
 * 1. Tab / Shift+Tab — browser default, never override
 * 2. WASD / Arrow keys — move focus between ALL visible interactive elements
 * 3. Enter / Space — activate the focused element (click it)
 * 4. Escape — close modals, overlays, exit focus mode
 * 5. Skip text inputs — never steal keys from input fields
 * 6. Visual focus ring — always visible when keyboard is active
 *
 * Implementation:
 * - Uses getBoundingClientRect() to find visible elements (not offsetParent)
 * - Sorts elements by visual position (top → bottom, left → right)
 * - Plays a soft click sound on navigation
 * - Sets data-keyboard-nav on body to show CSS focus rings
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

/** Returns all visible, focusable elements sorted by visual position */
function getVisibleFocusables(): HTMLElement[] {
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return all.filter(el => {
    const rect = el.getBoundingClientRect();
    // Must have non-zero size and be within the viewport (or just below it)
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top < window.innerHeight + 200 &&
      rect.bottom > -200
    );
  }).sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    // Sort top-to-bottom, then left-to-right
    if (Math.abs(ra.top - rb.top) > 10) return ra.top - rb.top;
    return ra.left - rb.left;
  });
}

/** Check if the active element should receive arrow keys natively */
function shouldPassThrough(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase();
  const role = el.getAttribute("role");
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (tag === "input" && (type === "range" || type === "number")) ||
    role === "slider" ||
    role === "spinbutton" ||
    role === "listbox" ||
    role === "combobox" ||
    // Inside a scrollable container that should scroll
    (el.closest('[role="listbox"]') !== null) ||
    (el.closest('[role="combobox"]') !== null)
  );
}

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const isKeyboardActiveRef = useRef(false);

  useEffect(() => {
    const body = document.body;

    // Activate keyboard mode on any key press, deactivate on mouse click
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isKeyboardActiveRef.current) {
        isKeyboardActiveRef.current = true;
        body.setAttribute("data-keyboard-nav", "true");
      }

      const active = document.activeElement as HTMLElement | null;

      // Never steal keys from text inputs
      if (shouldPassThrough(active)) return;

      const key = e.key;
      const isNav = ["w", "a", "s", "d", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(key);
      const isActivate = key === "Enter" || key === " ";

      if (isNav) {
        e.preventDefault();
        const focusables = getVisibleFocusables();
        if (focusables.length === 0) return;

        const currentIdx = active ? focusables.indexOf(active) : -1;
        const isForward = key === "s" || key === "d" || key === "ArrowDown" || key === "ArrowRight";
        const isBackward = key === "w" || key === "a" || key === "ArrowUp" || key === "ArrowLeft";

        let nextIdx: number;
        if (currentIdx === -1) {
          nextIdx = 0;
        } else if (isForward) {
          nextIdx = Math.min(focusables.length - 1, currentIdx + 1);
        } else if (isBackward) {
          nextIdx = Math.max(0, currentIdx - 1);
        } else {
          return;
        }

        const target = focusables[nextIdx];
        if (target && target !== active) {
          target.focus({ preventScroll: false });
          target.scrollIntoView({ block: "nearest", behavior: "smooth" });
          sounds.click();

          // Announce element for screen readers / blind mode
          const label =
            target.getAttribute("aria-label") ||
            target.getAttribute("title") ||
            target.textContent?.trim().slice(0, 60) ||
            target.tagName.toLowerCase();
          // Dispatch a custom event that useAccessibilityProfile can listen to
          window.dispatchEvent(new CustomEvent("hikma:focus-announce", { detail: { label } }));
        }
        return;
      }

      if (isActivate && active && active !== document.body) {
        // Don't double-fire Enter on buttons/links (browser handles those)
        const tag = active.tagName.toLowerCase();
        const role = active.getAttribute("role");
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

    // Use capture so we get the event before React handlers
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

export function useKeyboard() {
  return useContext(KeyboardContext);
}
