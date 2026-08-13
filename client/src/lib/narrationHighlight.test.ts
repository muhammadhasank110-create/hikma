import { describe, expect, it } from "vitest";
import { findSpokenWordIndex, getNarrationHighlightState } from "./narrationHighlight";

describe("getNarrationHighlightState", () => {
  it("uses the standard active treatment while narration is progressing", () => {
    expect(getNarrationHighlightState({ isNarrating: true, isFocused: false, highlightIndex: 2, reduceMotion: false })).toEqual({
      shouldHighlight: true, className: "tts-word-active", scrollBehavior: "smooth",
    });
  });

  it("uses focus treatment and avoids smooth scrolling for reduced-motion learners", () => {
    expect(getNarrationHighlightState({ isNarrating: true, isFocused: true, highlightIndex: 0, reduceMotion: true })).toEqual({
      shouldHighlight: true, className: "tts-word-active tts-word-focus", scrollBehavior: "auto",
    });
  });

  it("does not highlight text after narration stops", () => {
    expect(getNarrationHighlightState({ isNarrating: false, isFocused: true, highlightIndex: 5, reduceMotion: false }).shouldHighlight).toBe(false);
  });

  it("maps each TTS boundary to the exact current word", () => {
    const offsets = [0, 6, 11]; // "Learn one word"
    expect(findSpokenWordIndex(offsets, 0)).toBe(0);
    expect(findSpokenWordIndex(offsets, 6)).toBe(1);
    expect(findSpokenWordIndex(offsets, 9)).toBe(1);
    expect(findSpokenWordIndex(offsets, 11)).toBe(2);
  });
});
