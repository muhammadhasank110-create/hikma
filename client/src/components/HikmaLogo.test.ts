import { describe, expect, it } from "vitest";
import { getHikmaLogoAsset, HIKMA_LOGO_ASPECTS, resolveHikmaLogoSurface } from "./HikmaLogo";

describe("HIKMA logo asset contract", () => {
  it("keeps the approved native proportions as the single rendering contract", () => {
    expect(HIKMA_LOGO_ASPECTS.icon).toBeCloseTo(242 / 316);
    expect(HIKMA_LOGO_ASPECTS.full).toBeCloseTo(776 / 636);
  });

  it("uses approved contrast-safe assets for light and dark surfaces", () => {
    expect(getHikmaLogoAsset("light", "icon")).toBe("/img/hikma-icon-dark.png");
    expect(getHikmaLogoAsset("dark", "icon")).toBe("/img/hikma-icon-white.png");
    expect(getHikmaLogoAsset("light", "full")).toBe("/img/hikma-wordmark.png");
    expect(getHikmaLogoAsset("dark", "full")).toBe("/img/hikma-wordmark-white-clean.png");
  });

  it("selects the contrast-safe dark-surface asset for dark and high-contrast themes", () => {
    expect(resolveHikmaLogoSurface("auto", "dark")).toBe("dark");
    expect(resolveHikmaLogoSurface("auto", "high_contrast")).toBe("dark");
    expect(resolveHikmaLogoSurface("auto", "light")).toBe("light");
    expect(resolveHikmaLogoSurface("light", "high_contrast")).toBe("light");
  });
});
