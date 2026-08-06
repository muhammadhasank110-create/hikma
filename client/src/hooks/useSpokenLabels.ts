/**
 * useSpokenLabels — opt-in "spoken labels" mode.
 *
 * When enabled, announces the label of any focussed or hovered element via
 * the existing useTTS hook. Defaults to OFF. Persisted to localStorage under
 * hikma:spoken-labels.
 *
 * CRITICAL: Must default to OFF. Blind users run NVDA/JAWS/VoiceOver and
 * would hear every label twice if this were on by default.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useTTS } from "./useTTS";
import { useProfile } from "@/contexts/ProfileContext";

function resolveLabel(el: Element): string | null {
  // 1. aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();

  // 2. aria-labelledby
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(" ")
      .map(id => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
      .join(" ");
    if (text) return text;
  }

  // 3. Associated <label> element (for inputs)
  const id = el.getAttribute("id");
  if (id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }

  // 4. title attribute
  const title = el.getAttribute("title");
  if (title?.trim()) return title.trim();

  // 5. Trimmed textContent (for buttons, links)
  const tag = el.tagName.toLowerCase();
  if (["button", "a", "[role=button]"].includes(tag) || el.getAttribute("role") === "button") {
    const text = el.textContent?.trim().replace(/\s+/g, " ");
    if (text && text.length < 120) return text;
  }

  return null;
}

function isInteractive(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute("role");
  const tabindex = el.getAttribute("tabindex");
  return (
    ["button", "a", "input", "select", "textarea", "summary"].includes(tag) ||
    ["button", "link", "checkbox", "radio", "tab", "menuitem", "option", "switch", "combobox"].includes(role ?? "") ||
    (tabindex !== null && tabindex !== "-1")
  );
}

export function useSpokenLabels() {
  const { locale } = useProfile();
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem("hikma:spoken-labels") === "true"; } catch { return false; }
  });

  const tts = useTTS({ lang: locale === "ar" ? "ar-SA" : "en-GB" });
  const lastLabel = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the user has interacted with the page (browsers block audio before gesture)
  const hasInteracted = useRef(false);

  const announce = useCallback((label: string) => {
    if (!hasInteracted.current) return; // Never autoplay before first gesture
    if (label === lastLabel.current) return; // Skip duplicates
    lastLabel.current = label;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      tts.stop();
      tts.speak(label);
    }, 250);
  }, [tts]);

  useEffect(() => {
    const markInteracted = () => { hasInteracted.current = true; };
    window.addEventListener("pointerdown", markInteracted, { once: true });
    window.addEventListener("keydown", markInteracted, { once: true });
    return () => {
      window.removeEventListener("pointerdown", markInteracted);
      window.removeEventListener("keydown", markInteracted);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleFocusIn = (e: FocusEvent) => {
      const el = e.target as Element;
      if (!isInteractive(el)) return;
      const label = resolveLabel(el);
      if (label) announce(label);
    };

    const handlePointerOver = (e: PointerEvent) => {
      const el = e.target as Element;
      if (!isInteractive(el)) return;
      const label = resolveLabel(el);
      if (label) announce(label);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("pointerover", handlePointerOver);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("pointerover", handlePointerOver);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled, announce]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("hikma:spoken-labels", String(next)); } catch {}
      return next;
    });
  }, []);

  return { enabled, toggle };
}
