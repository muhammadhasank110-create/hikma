import { describe, expect, it } from "vitest";
import { formatHikmaNumber } from "./formatNumber";

describe("formatHikmaNumber", () => {
  it("uses Arabic-Indic digits only for Arabic learners who choose that preference", () => {
    expect(formatHikmaNumber(125, "ar", "arabic_indic")).toBe("١٢٥");
  });

  it("preserves western digits in English and for the Arabic western-numeral preference", () => {
    expect(formatHikmaNumber(125, "en", "arabic_indic")).toBe("125");
    expect(formatHikmaNumber(125, "ar", "western")).toBe("125");
  });

  it("formats decimal display values without changing their precision contract", () => {
    expect(formatHikmaNumber(1.25, "ar", "arabic_indic", { minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe("١٫٢٥");
  });
});
