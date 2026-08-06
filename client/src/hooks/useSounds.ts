/**
 * useSounds — wrapper around the sound.ts library.
 * Sound is OFF by default (localStorage 'hikma:sound' === 'on' to enable).
 */
import { playSound } from "@/lib/sound";

export function useSounds() {
  return {
    tap:            () => playSound("tap"),
    correct:        () => playSound("correct"),
    incorrect:      () => playSound("incorrect"),
    complete:       () => playSound("complete"),
    achievement:    () => playSound("achievement"),
    error:          () => playSound("error"),
    open:           () => playSound("open"),
    close:          () => playSound("close"),
    navigate:       () => playSound("navigate"),
    questionAppear: () => playSound("questionAppear"),
    // legacy aliases
    click:          () => playSound("tap"),
    success:        () => playSound("correct"),
    levelUp:        () => playSound("achievement"),
    sectionStart:   () => playSound("navigate"),
    notification:   () => playSound("open"),
    focus:          () => playSound("navigate"),
  };
}
