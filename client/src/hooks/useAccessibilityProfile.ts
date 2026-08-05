/**
 * useAccessibilityProfile
 *
 * Applies global accessibility behaviours based on the user's profile:
 *
 * BLIND / LOW_VISION mode:
 *  - Attaches a global `focusin` listener to the document
 *  - When any interactive element receives focus, reads its accessible name via TTS
 *  - Reads: aria-label > aria-labelledby > placeholder > textContent (trimmed)
 *
 * ADHD / FOCUS mode:
 *  - Sets `data-focus-mode="true"` on <html> so CSS can strip decorations
 *  - Disables all animations via CSS custom properties
 *
 * DYSLEXIA mode:
 *  - Sets `data-dyslexia="true"` on <html> for CSS font/spacing overrides
 *
 * This hook is mounted once in App.tsx and runs for the lifetime of the session.
 */
import { useEffect, useRef } from "react";
import { useProfile } from "@/contexts/ProfileContext";

// Elements that should trigger TTS on focus in blind mode
const INTERACTIVE_SELECTORS = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[role='tab']",
  "[role='radio']",
  "[role='checkbox']",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getAccessibleName(el: HTMLElement): string {
  // 1. aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();

  // 2. aria-labelledby
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
  }

  // 3. <label> associated via for/id
  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }

  // 4. placeholder
  const placeholder = (el as HTMLInputElement).placeholder;
  if (placeholder?.trim()) return placeholder.trim();

  // 5. title attribute
  const title = el.getAttribute("title");
  if (title?.trim()) return title.trim();

  // 6. textContent (for buttons and links)
  const text = el.textContent?.trim().replace(/\s+/g, " ");
  if (text && text.length < 100) return text;

  // 7. value (for inputs)
  const value = (el as HTMLInputElement).value;
  if (value?.trim()) return value.trim();

  return el.tagName.toLowerCase();
}

export function useAccessibilityProfile() {
  const { profile } = useProfile();
  const lastSpokenRef = useRef<string>("");
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isBlindMode = profile.mode === "audio_first" && profile.autoNarrate;
  const isFocusMode = profile.mode === "focus";
  const isDyslexiaMode = profile.theme === "cream" && profile.letterSpacing > 0;

  // ── Blind mode: TTS on focus ──────────────────────────────────────────────
  useEffect(() => {
    if (!isBlindMode || !("speechSynthesis" in window)) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.matches(INTERACTIVE_SELECTORS)) return;

      const name = getAccessibleName(target);
      const role = target.getAttribute("role") || target.tagName.toLowerCase();
      const roleLabel = role === "button" || target.tagName === "BUTTON" ? "button" :
        role === "link" || target.tagName === "A" ? "link" :
        target.tagName === "INPUT" ? `${(target as HTMLInputElement).type || "text"} field` :
        "";

      const announcement = roleLabel ? `${name}, ${roleLabel}` : name;

      // Don't re-announce the same element
      if (announcement === lastSpokenRef.current) return;
      lastSpokenRef.current = announcement;

      // Cancel any ongoing speech and speak the new announcement
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(announcement);
      utt.rate = Math.max(0.8, profile.speechRate);
      utt.volume = 1;
      speechRef.current = utt;
      setTimeout(() => window.speechSynthesis.speak(utt), 30);
    };

    document.addEventListener("focusin", handleFocus);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      window.speechSynthesis.cancel();
    };
  }, [isBlindMode, profile.speechRate]);

  // ── ADHD focus mode: set HTML attribute for CSS ───────────────────────────
  useEffect(() => {
    const html = document.documentElement;
    if (isFocusMode) {
      html.setAttribute("data-focus-mode", "true");
    } else {
      html.removeAttribute("data-focus-mode");
    }
    return () => html.removeAttribute("data-focus-mode");
  }, [isFocusMode]);

  // ── Dyslexia mode: set HTML attribute for CSS ─────────────────────────────
  useEffect(() => {
    const html = document.documentElement;
    if (isDyslexiaMode) {
      html.setAttribute("data-dyslexia", "true");
    } else {
      html.removeAttribute("data-dyslexia");
    }
    return () => html.removeAttribute("data-dyslexia");
  }, [isDyslexiaMode]);
}
