/**
 * HikmaLogo — single decision point for logo rendering.
 *
 * surface="dark"  → dark-green rounded plate (for dark/high-contrast nav, mobile sheet)
 * surface="light" → cream rounded plate (for light/cream/calm sub-headers)
 * variant="wordmark" → full falcon + حكمة | HIKMA wordmark (for onboarding, sign-in panel)
 *
 * All images are vendored in /img/ — no external fetches.
 */
import { useTheme } from "@/contexts/ThemeContext";

type Surface = "dark" | "light" | "auto";
type Variant = "icon" | "wordmark";

interface HikmaLogoProps {
  surface?: Surface;
  variant?: Variant;
  className?: string;
  /** px size for icon variant (width = height). Defaults to 44. */
  size?: number;
  /** For wordmark: explicit width in px. Defaults to 160. */
  width?: number;
  /** alt text override. Defaults to "Hikma" on the primary mark, "" on decorative. */
  alt?: string;
  /** When true, adds aria-hidden="true" and alt="" (decorative repeat). */
  decorative?: boolean;
}

const DARK_ICON = "/img/hikma-icon-dark.png";   // dark-green plate, white falcon — for dark surfaces
const LIGHT_ICON = "/img/hikma-icon-light.png"; // cream plate, dark falcon — for light surfaces
const WORDMARK_LIGHT = "/img/hikma-wordmark.png";       // dark text — for light surfaces
const WORDMARK_DARK  = "/img/hikma-wordmark-white.png"; // white text — for dark surfaces

/** Themes that use a dark nav surface */
const DARK_SURFACE_THEMES = new Set(["dark", "high_contrast"]);

export function HikmaLogo({
  surface = "auto",
  variant = "icon",
  className = "",
  size = 44,
  width = 160,
  alt,
  decorative = false,
}: HikmaLogoProps) {
  const { theme } = useTheme();

  // Resolve surface from theme when "auto"
  const resolvedSurface: "dark" | "light" =
    surface === "auto"
      ? DARK_SURFACE_THEMES.has(theme) ? "dark" : "light"
      : surface;

  const imgAlt = decorative ? "" : (alt ?? "Hikma");
  const ariaHidden = decorative ? true : undefined;

  if (variant === "wordmark") {
    const wordmarkSrc = resolvedSurface === "dark" ? WORDMARK_DARK : WORDMARK_LIGHT;
    return (
      <img
        src={wordmarkSrc}
        alt={imgAlt}
        aria-hidden={ariaHidden}
        width={width}
        height={Math.round(width * (636 / 776))} // preserve aspect ratio
        className={`object-contain ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }

  const src = resolvedSurface === "dark" ? DARK_ICON : LIGHT_ICON;
  // Dark icon is 418x322 (not square — the plate is square but the canvas has some padding)
  // Light icon is 246x246
  const aspectH = resolvedSurface === "dark"
    ? Math.round(size * (322 / 418))
    : size;

  return (
    <img
      src={src}
      alt={imgAlt}
      aria-hidden={ariaHidden}
      width={size}
      height={aspectH}
      className={`object-contain ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
