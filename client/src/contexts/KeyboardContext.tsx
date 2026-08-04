import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useProfile } from "./ProfileContext";

export type ShortcutScope = "global" | "lesson" | "focus" | "tutor" | "map";

export interface Shortcut {
  id: string;
  scope: ShortcutScope;
  key: string;
  modifiers?: ("ctrl" | "alt" | "shift" | "meta")[];
  descriptionEn: string;
  descriptionAr: string;
  action: () => void;
  disabled?: boolean;
}

interface KeyboardContextValue {
  registerShortcut: (shortcut: Shortcut) => () => void;
  unregisterShortcut: (id: string) => void;
  getShortcuts: (scope?: ShortcutScope) => Shortcut[];
  activeScope: ShortcutScope;
  setActiveScope: (scope: ShortcutScope) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  shortcutSheetOpen: boolean;
  setShortcutSheetOpen: (open: boolean) => void;
}

const KeyboardContext = createContext<KeyboardContextValue>({
  registerShortcut: () => () => {},
  unregisterShortcut: () => {},
  getShortcuts: () => [],
  activeScope: "global",
  setActiveScope: () => {},
  commandPaletteOpen: false,
  setCommandPaletteOpen: () => {},
  shortcutSheetOpen: false,
  setShortcutSheetOpen: () => {},
});

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const shortcutsRef = useRef<Map<string, Shortcut>>(new Map());
  const [activeScope, setActiveScope] = React.useState<ShortcutScope>("global");
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [shortcutSheetOpen, setShortcutSheetOpen] = React.useState(false);

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    shortcutsRef.current.set(shortcut.id, shortcut);
    return () => shortcutsRef.current.delete(shortcut.id);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    shortcutsRef.current.delete(id);
  }, []);

  const getShortcuts = useCallback((scope?: ShortcutScope) => {
    const all = Array.from(shortcutsRef.current.values());
    return scope ? all.filter(s => s.scope === scope || s.scope === "global") : all;
  }, []);

  // Global keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Never fire shortcuts on input elements unless it's a modifier combo
      const target = e.target as HTMLElement;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;

      // Command palette: Ctrl/Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Shortcut sheet: ?
      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShortcutSheetOpen(true);
        return;
      }

      // Escape: close overlays
      if (e.key === "Escape") {
        if (commandPaletteOpen) { setCommandPaletteOpen(false); return; }
        if (shortcutSheetOpen) { setShortcutSheetOpen(false); return; }
      }

      // Single-key shortcuts disabled on input elements or when profile says so
      if (isInput && !e.ctrlKey && !e.altKey && !e.metaKey) return;
      if (!profile.singleKeyShortcuts && !e.ctrlKey && !e.altKey && !e.metaKey) return;

      // Match shortcuts
      const shortcuts = Array.from(shortcutsRef.current.values());
      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;
        if (shortcut.scope !== "global" && shortcut.scope !== activeScope) continue;

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
          e.code.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.modifiers?.includes("ctrl") ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
        const altMatch = shortcut.modifiers?.includes("alt") ? e.altKey : !e.altKey;
        const shiftMatch = shortcut.modifiers?.includes("shift") ? e.shiftKey : !e.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeScope, commandPaletteOpen, shortcutSheetOpen, profile.singleKeyShortcuts]);

  return (
    <KeyboardContext.Provider value={{
      registerShortcut, unregisterShortcut, getShortcuts,
      activeScope, setActiveScope,
      commandPaletteOpen, setCommandPaletteOpen,
      shortcutSheetOpen, setShortcutSheetOpen,
    }}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  return useContext(KeyboardContext);
}
