import { describe, expect, it } from "vitest";
import { getVoiceActivityLabel } from "./VoiceActivityIndicator";

describe("voice activity labels", () => {
  it("announces all English states", () => {
    expect(getVoiceActivityLabel("idle")).toBe("Voice is idle");
    expect(getVoiceActivityLabel("listening")).toBe("Hikma is listening");
    expect(getVoiceActivityLabel("speaking")).toBe("Hikma is speaking");
  });

  it("announces Arabic listening state", () => {
    expect(getVoiceActivityLabel("listening", "ar")).toBe("حكمة تستمع");
  });
});
