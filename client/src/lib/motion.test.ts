import { describe, expect, it } from "vitest";
import { createHikmaMotionConfig, motionTokens } from "./motion";

describe("createHikmaMotionConfig", () => {
  it("removes transform entrance states and uses an instant transition when motion is reduced", () => {
    const config = createHikmaMotionConfig(true);

    expect(config.reduceMotion).toBe(true);
    expect(config.page.initial).toBe(false);
    expect(config.item.initial).toBe(false);
    expect(config.transition).toEqual({ duration: motionTokens.duration.instant });
    expect(config.press).toEqual({});
  });

  it("uses short opacity-and-transform motion for standard interactions", () => {
    const config = createHikmaMotionConfig(false);

    expect(config.page.initial).toEqual({ opacity: 0, y: motionTokens.distance.standard });
    expect(config.item.initial).toEqual({ opacity: 0, y: motionTokens.distance.subtle });
    expect(config.press).toEqual({ scale: motionTokens.scale.press });
    expect(config.transition).toMatchObject({ duration: motionTokens.duration.standard });
  });
});
