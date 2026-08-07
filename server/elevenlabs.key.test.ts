import { describe, it, expect } from "vitest";

describe("ElevenLabs API keys", () => {
  it("VITE_ELEVENLABS_API_KEY is set and starts with sk_", () => {
    const key = process.env.VITE_ELEVENLABS_API_KEY;
    expect(key, "VITE_ELEVENLABS_API_KEY must be set").toBeTruthy();
    expect(key!.length, "Key must be at least 32 characters").toBeGreaterThanOrEqual(32);
    expect(key, "Key must not be a placeholder").not.toContain("placeholder");
    expect(key, "Key must start with sk_").toMatch(/^sk_/);
  });
  it("ELEVENLABS_API_KEY (server) is set and starts with sk_", () => {
    const key = process.env.ELEVENLABS_API_KEY;
    expect(key, "ELEVENLABS_API_KEY must be set").toBeTruthy();
    expect(key!.length, "Key must be at least 32 characters").toBeGreaterThanOrEqual(32);
    expect(key, "Key must start with sk_").toMatch(/^sk_/);
  });
});
