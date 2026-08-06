/**
 * useGridNavigation — lane-constrained keyboard navigation.
 *
 * DESIGN PRINCIPLE: Each container is a completely isolated navigation zone.
 * Arrow keys ONLY move focus within the container they are attached to.
 * They NEVER move focus outside the container, and they NEVER see elements
 * from other containers. This is enforced by:
 *   1. The keydown listener is on the container element, not window.
 *   2. We only query children of THIS container.
 *   3. We call stopPropagation() so parent/window listeners never see the event.
 *
 * Row detection: groups children by their getBoundingClientRect().top within
 * a 4px tolerance. Each group is one "row". Left/Right move within a row.
 * Up/Down move between rows at the nearest column position.
 *
 * Roving tabIndex: exactly one child has tabIndex=0 at a time. Tab enters
 * the group once and Tab again leaves it entirely.
 *
 * WASD: mapped to the same handlers but ONLY when:
 *   - target is not input/textarea/select/[contenteditable]
 *   - no modifier key is held
 *   - disableWASD is false (set true on LessonPage where 's' is bound to simplify)
 *
 * RTL-aware: in dir="rtl", ArrowRight moves to the PREVIOUS item.
 *
 * NOTE: WASD is intentionally disabled on LessonPage because 's' is already
 * bound to simplify-section at the window level. Arrow keys still work there.
 */
import { useEffect, useRef, useCallback } from "react";

interface GridNavOptions {
  /** Disable WASD (use on pages that already bind single keys globally) */
  disableWASD?: boolean;
  /** Wrap within a row? Default false — stops at the end */
  wrap?: boolean;
  /** Selector for focusable children. Default: buttons, a[href], [tabindex] */
  selector?: string;
}

const DEFAULT_SELECTOR = [
  'button:not([disabled]):not([aria-disabled="true"])',
  'a[href]',
  '[role="tab"]',
  '[role="radio"]',
  '[role="checkbox"]',
].join(", ");

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

function getRowsFromContainer(container: HTMLElement, selector: string): HTMLElement[][] {
  // Only query DIRECT children that match the selector, not nested ones from other components
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(el => {
    // Only include elements whose closest ancestor matching the container is THIS container
    // This prevents picking up elements from nested grid-nav containers
    let parent = el.parentElement;
    while (parent && parent !== container) {
      if (parent.hasAttribute("data-grid-nav")) return false;
      parent = parent.parentElement;
    }
    return true;
  });

  if (!items.length) return [];

  // Group by Y position with 4px tolerance
  const rows: HTMLElement[][] = [];
  let currentRow: HTMLElement[] = [];
  let rowTop = -Infinity;

  for (const el of items) {
    const rect = el.getBoundingClientRect();
    const top = Math.round(rect.top);
    if (Math.abs(top - rowTop) > 4) {
      if (currentRow.length) rows.push(currentRow);
      currentRow = [el];
      rowTop = top;
    } else {
      currentRow.push(el);
    }
  }
  if (currentRow.length) rows.push(currentRow);
  return rows;
}

export function useGridNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: GridNavOptions = {}
) {
  const { disableWASD = false, wrap = false, selector = DEFAULT_SELECTOR } = options;
  const desiredColRef = useRef<number>(0);

  const initRovingTabIndex = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>(selector));
    if (!items.length) return;
    const hasFocus = items.some(el => el.tabIndex === 0);
    if (!hasFocus) {
      items.forEach((el, i) => { el.tabIndex = i === 0 ? 0 : -1; });
    }
  }, [containerRef, selector]);

  const moveFocus = useCallback(
    (direction: "left" | "right" | "up" | "down" | "home" | "end" | "ctrl-home" | "ctrl-end") => {
      const container = containerRef.current;
      if (!container) return;
      const rows = getRowsFromContainer(container, selector);
      if (!rows.length) return;

      const isRTL = document.documentElement.dir === "rtl";
      let dir = direction;
      if (isRTL) {
        if (direction === "left") dir = "right";
        else if (direction === "right") dir = "left";
      }

      const focused = document.activeElement as HTMLElement | null;
      let rowIdx = -1;
      let colIdx = -1;
      for (let r = 0; r < rows.length; r++) {
        const c = rows[r].indexOf(focused as HTMLElement);
        if (c !== -1) { rowIdx = r; colIdx = c; break; }
      }

      if (rowIdx === -1) {
        rows[0]?.[0]?.focus();
        if (rows[0]?.[0]) {
          const allItems = rows.flat();
          allItems.forEach(el => { el.tabIndex = -1; });
          rows[0][0].tabIndex = 0;
          desiredColRef.current = 0;
        }
        return;
      }

      let targetEl: HTMLElement | null = null;

      if (dir === "ctrl-home") {
        targetEl = rows[0][0];
        desiredColRef.current = 0;
      } else if (dir === "ctrl-end") {
        const lastRow = rows[rows.length - 1];
        targetEl = lastRow[lastRow.length - 1];
        desiredColRef.current = lastRow.length - 1;
      } else if (dir === "home") {
        targetEl = rows[rowIdx][0];
        desiredColRef.current = 0;
      } else if (dir === "end") {
        const last = rows[rowIdx].length - 1;
        targetEl = rows[rowIdx][last];
        desiredColRef.current = last;
      } else if (dir === "left") {
        if (colIdx > 0) {
          targetEl = rows[rowIdx][colIdx - 1];
          desiredColRef.current = colIdx - 1;
        }
        // wrap=false: do nothing at row start
      } else if (dir === "right") {
        if (colIdx < rows[rowIdx].length - 1) {
          targetEl = rows[rowIdx][colIdx + 1];
          desiredColRef.current = colIdx + 1;
        }
        // wrap=false: do nothing at row end
      } else if (dir === "up") {
        if (rowIdx > 0) {
          const prevRow = rows[rowIdx - 1];
          const col = Math.min(desiredColRef.current, prevRow.length - 1);
          targetEl = prevRow[col];
        }
      } else if (dir === "down") {
        if (rowIdx < rows.length - 1) {
          const nextRow = rows[rowIdx + 1];
          const col = Math.min(desiredColRef.current, nextRow.length - 1);
          targetEl = nextRow[col];
        }
      }

      if (targetEl) {
        const allItems = rows.flat();
        allItems.forEach(el => { el.tabIndex = -1; });
        targetEl.tabIndex = 0;
        targetEl.focus();
      }
    },
    [containerRef, selector, wrap]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mark this container so nested containers can exclude its children
    container.setAttribute("data-grid-nav", "true");
    initRovingTabIndex();

    const handler = (e: KeyboardEvent) => {
      // Only handle if focus is INSIDE this container
      if (!container.contains(document.activeElement)) return;

      const isWASD =
        !disableWASD &&
        !isTypingTarget(e.target) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey;

      let dir: "left" | "right" | "up" | "down" | "home" | "end" | "ctrl-home" | "ctrl-end" | null = null;

      switch (e.key) {
        case "ArrowLeft":  dir = "left";  break;
        case "ArrowRight": dir = "right"; break;
        case "ArrowUp":    dir = "up";    break;
        case "ArrowDown":  dir = "down";  break;
        case "Home":       dir = e.ctrlKey ? "ctrl-home" : "home"; break;
        case "End":        dir = e.ctrlKey ? "ctrl-end" : "end";   break;
        case "a": case "A": if (isWASD) dir = "left";  break;
        case "d": case "D": if (isWASD) dir = "right"; break;
        case "w": case "W": if (isWASD) dir = "up";    break;
        case "s": case "S": if (isWASD) dir = "down";  break;
      }

      if (dir) {
        e.preventDefault();
        // CRITICAL: stopPropagation prevents this event from reaching:
        // - Parent grid-nav containers (which would double-move focus)
        // - Window-level handlers (LessonPage section navigation)
        e.stopPropagation();
        moveFocus(dir);
      }
    };

    container.addEventListener("keydown", handler);
    return () => {
      container.removeEventListener("keydown", handler);
      container.removeAttribute("data-grid-nav");
    };
  }, [containerRef, initRovingTabIndex, moveFocus, disableWASD]);

  return { initRovingTabIndex };
}
