/**
 * useAccessibilityProfile
 *
 * Applies global accessibility behaviours based on the user's profile.
 *
 * BLIND / AUDIO_FIRST mode:
 *  - Attaches a global `focusin` listener to the document
 *  - When any interactive element receives focus, reads its accessible name
 *    via the SpeechContext (assertive priority — cancels narration instantly)
 *  - Uses browser voice for short announcements to avoid ElevenLabs latency
 *
 * ADHD / FOCUS mode:
 *  - Sets `data-focus-mode="true"` on <html> so CSS can strip decorations
 *
 * DYSLEXIA mode:
 *  - Sets `data-dyslexia="true"` on <html> for CSS font/spacing overrides
 *
 * This hook is mounted once in App.tsx and runs for the lifetime of the session.
 */
import { useEffect, useRef } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useSpeech } from "@/contexts/SpeechContext";

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
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
  }

  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }

  const placeholder = (el as HTMLInputElement).placeholder;
  if (placeholder?.trim()) return placeholder.trim();

  const title = el.getAttribute("title");
  if (title?.trim()) return title.trim();

  const text = el.textContent?.trim().replace(/\s+/g, " ");
  if (text && text.length < 100) return text;

  const value = (el as HTMLInputElement).value;
  if (value?.trim()) return value.trim();

  return el.tagName.toLowerCase();
}

export function useAccessibilityProfile() {
  const { profile } = useProfile();
  // Use the shared speech service — no direct SpeechSynthesisUtterance here
  const speech = useSpeech();
  const lastSpokenRef = useRef<string>("");

  const isBlindMode = profile.mode === "audio_first" && profile.autoNarrate;
  const isFocusMode = profile.mode === "focus";
  const isDyslexiaMode = profile.theme === "cream" && profile.letterSpacing > 0;

  // ── Blind mode: TTS on focus ──────────────────────────────────────────────
  useEffect(() => {
    if (!isBlindMode) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.matches(INTERACTIVE_SELECTORS)) return;

      const name = getAccessibleName(target);
      const role = target.getAttribute("role") || target.tagName.toLowerCase();
      const roleLabel =
        role === "button" || target.tagName === "BUTTON" ? "button" :
        role === "link" || target.tagName === "A" ? "link" :
        target.tagName === "INPUT" ? `${(target as HTMLInputElement).type || "text"} field` :
        "";

      const announcement = roleLabel ? `${name}, ${roleLabel}` : name;
      if (announcement === lastSpokenRef.current) return;
      lastSpokenRef.current = announcement;

      // assertive priority: cancels narration immediately.
      // SpeechContext uses browser voice for short items (< 60 chars) to avoid
      // ElevenLabs network latency on every focus event — this is intentional.
      speech.speak(announcement, { priority: "assertive" });
    };

    document.addEventListener("focusin", handleFocus);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      speech.stop();
    };
  }, [isBlindMode, speech]);

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
