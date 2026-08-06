/**
 * useGridNavigation — 2D "lane-constrained" keyboard navigation.
 *
 * Left/Right move ONLY within the current row.
 * Up/Down move to the row above/below, landing at the nearest column position.
 * Focus never jumps diagonally.
 *
 * Implements ROVING TABINDEX: exactly one element has tabIndex=0 at a time.
 * Tab enters the group once; Tab again leaves it entirely.
 *
 * WASD is mapped to the same handlers but ONLY when:
 *   - target is not input/textarea/select/[contenteditable]
 *   - no modifier key is held
 *   - focus is inside this container
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

const DEFAULT_SELECTOR =
  'button:not([disabled]):not([aria-disabled="true"]), a[href], [tabindex]:not([tabindex="-1"])';

function getRows(
  container: HTMLElement,
  selector: string
): HTMLElement[][] {
  const items = Array.from(container.querySelectorAll<HTMLElement>(selector));
  if (!items.length) return [];
  const rows: HTMLElement[][] = [];
  let currentRow: HTMLElement[] = [];
  let rowTop = -Infinity;
  for (const el of items) {
    const top = Math.round(el.getBoundingClientRect().top);
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

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable
  );
}

export function useGridNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: GridNavOptions = {}
) {
  const { disableWASD = false, wrap = false, selector = DEFAULT_SELECTOR } = options;
  // "desired column" — preserved when moving through short rows
  const desiredColRef = useRef<number>(0);

  const initRovingTabIndex = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>(selector));
    if (!items.length) return;
    // If none has tabIndex=0, assign it to the first
    const hasFocus = items.some(el => el.tabIndex === 0);
    if (!hasFocus) {
      items.forEach((el, i) => { el.tabIndex = i === 0 ? 0 : -1; });
    }
  }, [containerRef, selector]);

  const moveFocus = useCallback(
    (direction: "left" | "right" | "up" | "down" | "home" | "end" | "ctrl-home" | "ctrl-end") => {
      const container = containerRef.current;
      if (!container) return;
      const rows = getRows(container, selector);
      if (!rows.length) return;
      const isRTL = document.documentElement.dir === "rtl";
      // Remap for RTL
      let dir = direction;
      if (isRTL) {
        if (direction === "left") dir = "right";
        else if (direction === "right") dir = "left";
      }

      // Find current focused element
      const focused = document.activeElement as HTMLElement | null;
      let rowIdx = -1;
      let colIdx = -1;
      for (let r = 0; r < rows.length; r++) {
        const c = rows[r].indexOf(focused as HTMLElement);
        if (c !== -1) { rowIdx = r; colIdx = c; break; }
      }
      if (rowIdx === -1) {
        // Focus not in grid — put it on first item
        rows[0][0]?.focus();
        rows[0][0].tabIndex = 0;
        desiredColRef.current = 0;
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
        } else if (wrap && rowIdx > 0) {
          // wrap=false by default — do nothing at row start
        }
      } else if (dir === "right") {
        if (colIdx < rows[rowIdx].length - 1) {
          targetEl = rows[rowIdx][colIdx + 1];
          desiredColRef.current = colIdx + 1;
        } else if (wrap && rowIdx < rows.length - 1) {
          // wrap=false by default — do nothing at row end
        }
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
        // Update roving tabIndex
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
    initRovingTabIndex();

    const handler = (e: KeyboardEvent) => {
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
        e.stopPropagation(); // Prevent LessonPage window listener from seeing it
        moveFocus(dir);
      }
    };

    container.addEventListener("keydown", handler);
    return () => container.removeEventListener("keydown", handler);
  }, [containerRef, initRovingTabIndex, moveFocus, disableWASD]);

  return { initRovingTabIndex };
}
