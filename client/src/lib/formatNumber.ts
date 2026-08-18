import type { Locale } from "@/contexts/ProfileContext";

type NumeralPreference = "arabic_indic" | "western";

export function formatHikmaNumber(
  value: number,
  locale: Locale,
  numerals: NumeralPreference,
  options: Intl.NumberFormatOptions = {},
) {
  const numberLocale = locale === "ar" && numerals === "arabic_indic" ? "ar-EG-u-nu-arab" : "en-US";
  return new Intl.NumberFormat(numberLocale, { useGrouping: false, ...options }).format(value);
}
