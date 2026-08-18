import { describe, expect, it } from "vitest";
import { getHikmaLogoAsset, HIKMA_LOGO_ASPECTS, resolveHikmaLogoSurface } from "./HikmaLogo";

describe("HIKMA logo asset contract", () => {
  it("keeps the approved native proportions as the single rendering contract", () => {
    expect(HIKMA_LOGO_ASPECTS.icon).toBe(1);
    expect(HIKMA_LOGO_ASPECTS.full).toBe(1);
  });

  it("uses approved contrast-safe assets for light and dark surfaces", () => {
    expect(getHikmaLogoAsset("light", "icon")).toBe("/manus-storage/hikma-logo-official-forest-transparent_95429dc9.png");
    expect(getHikmaLogoAsset("dark", "icon")).toBe("/manus-storage/hikma-logo-official-cream-transparent_c99c136d.png");
    expect(getHikmaLogoAsset("light", "full")).toBe("/manus-storage/hikma-logo-official-forest-transparent_95429dc9.png");
    expect(getHikmaLogoAsset("dark", "full")).toBe("/manus-storage/hikma-logo-official-cream-transparent_c99c136d.png");
  });

  it("selects the contrast-safe dark-surface asset for dark and high-contrast themes", () => {
    expect(resolveHikmaLogoSurface("auto", "dark")).toBe("dark");
    expect(resolveHikmaLogoSurface("auto", "high_contrast")).toBe("dark");
    expect(resolveHikmaLogoSurface("auto", "light")).toBe("light");
    expect(resolveHikmaLogoSurface("light", "high_contrast")).toBe("light");
  });
});
