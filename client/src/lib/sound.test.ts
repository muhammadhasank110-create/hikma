import { describe, expect, it } from "vitest";
import { getSoundVolume, isSoundEnabled, setSoundEnabled, setSoundVolume } from "./sound";

describe("sound preferences", () => {
  it("does not throw when browser storage is unavailable", () => {
    expect(() => setSoundEnabled(true)).not.toThrow();
    expect(() => setSoundVolume(0.5)).not.toThrow();
    expect(isSoundEnabled()).toBe(false);
    expect(getSoundVolume()).toBe(0.7);
  });
});
