import { describe, expect, it } from "vitest";
import { buildWordStartTimes, clampSpeechRate, getAlignedWordIndex } from "./useTTS";

describe("aligned TTS word timing", () => {
  const text = "Alpha beta gamma.";
  const alignment = {
    characters: Array.from(text),
    character_start_times_seconds: Array.from(text, (_, index) => index * 0.06),
  };

  it("maps each text word to its provider-aligned audio start time", () => {
    const times = buildWordStartTimes(text, alignment)!;
    expect(times).toHaveLength(3);
    expect(times[0]).toBeCloseTo(0);
    expect(times[1]).toBeCloseTo(0.36);
    expect(times[2]).toBeCloseTo(0.66);
  });

  it("selects the word actually active at the audio element currentTime", () => {
    const times = buildWordStartTimes(text, alignment)!;
    expect(getAlignedWordIndex(times, 0.02)).toBe(0);
    expect(getAlignedWordIndex(times, 0.5)).toBe(1);
    expect(getAlignedWordIndex(times, 0.82)).toBe(2);
  });
});

describe("speech rate normalization", () => {
  it("preserves the supported lesson-local range and safely clamps invalid values", () => {
    expect(clampSpeechRate(0.5)).toBe(0.5);
    expect(clampSpeechRate(1.5)).toBe(1.5);
    expect(clampSpeechRate(2)).toBe(2);
    expect(clampSpeechRate(0.2)).toBe(0.5);
    expect(clampSpeechRate(4)).toBe(2);
    expect(clampSpeechRate(Number.NaN)).toBe(1);
  });
});
