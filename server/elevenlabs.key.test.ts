import { describe, it, expect } from "vitest";

describe("ElevenLabs API key", () => {
  it("VITE_ELEVENLABS_API_KEY is set and has the correct format", () => {
    const key = process.env.VITE_ELEVENLABS_API_KEY;
    // Key must be present
    expect(key, "VITE_ELEVENLABS_API_KEY must be set").toBeTruthy();
    // ElevenLabs keys are 64-character hex strings
    expect(key!.length, "Key must be at least 32 characters").toBeGreaterThanOrEqual(32);
    // Must not be the placeholder
    expect(key, "Key must not be a placeholder").not.toContain("placeholder");
    expect(key, "Key must not be empty").not.toBe("");
  });
});
