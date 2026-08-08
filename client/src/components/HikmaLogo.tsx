/**
 * HikmaLogo — single decision point for all logo rendering in Hikma.
 *
 * Two source PNGs (both transparent background, from the user's brand assets):
 *   hikma-icon-dark.png  — dark green falcon calligraphy, 242×316 — for LIGHT surfaces
 *   hikma-icon-white.png — white falcon calligraphy, 242×316   — for DARK surfaces
 *   hikma-wordmark.png   — full dark green logo + حكمة|HIKMA text, 776×636 — for LIGHT surfaces
 *   hikma-wordmark-white-clean.png — white version, 776×636 — for DARK surfaces
 *
 * Usage:
 *   <HikmaLogo />                          → icon, auto-detects surface from theme
 *   <HikmaLogo surface="dark" size={48} /> → white icon for dark nav
 *   <HikmaLogo surface="light" size={48} />→ dark icon for light header
 *   <HikmaLogo variant="wordmark" width={200} surface="light" /> → full wordmark
 */
import { useTheme } from "@/contexts/ThemeContext";

type Surface = "dark" | "light" | "auto";
type Variant = "icon" | "wordmark";

interface HikmaLogoProps {
  surface?: Surface;
  variant?: Variant;
  className?: string;
  /** px height for icon variant. Width is calculated from aspect ratio (242:316). Defaults to 48. */
  size?: number;
  /** For wordmark: explicit width in px. Height calculated from aspect ratio (776:636). Defaults to 180. */
  width?: number;
  alt?: string;
  decorative?: boolean;
}

// Icon: 242×316 (portrait) — aspect ratio 0.7658
const ICON_ASPECT = 242 / 316;
// Wordmark: 776×636 (landscape) — aspect ratio 1.2201
const WORDMARK_ASPECT = 776 / 636;

const DARK_ICON      = "/img/hikma-icon-dark.png";           // dark green — for LIGHT surfaces
const WHITE_ICON     = "/img/hikma-icon-white.png";          // white — for DARK surfaces
const DARK_WORDMARK  = "/img/hikma-wordmark.png";            // dark green — for LIGHT surfaces
const WHITE_WORDMARK = "/img/hikma-wordmark-white-clean.png"; // white — for DARK surfaces

const DARK_SURFACE_THEMES = new Set(["dark", "high_contrast"]);

export function HikmaLogo({
  surface = "auto",
  variant = "icon",
  className = "",
  size = 48,
  width = 180,
  alt,
  decorative = false,
}: HikmaLogoProps) {
  const { theme } = useTheme();

  const resolvedSurface: "dark" | "light" =
    surface === "auto"
      ? DARK_SURFACE_THEMES.has(theme) ? "dark" : "light"
      : surface;

  const imgAlt = decorative ? "" : (alt ?? "Hikma");
  const ariaHidden = decorative ? true : undefined;

  if (variant === "wordmark") {
    const src = resolvedSurface === "dark" ? WHITE_WORDMARK : DARK_WORDMARK;
    const h = Math.round(width / WORDMARK_ASPECT);
    return (
      <img
        src={src}
        alt={imgAlt}
        aria-hidden={ariaHidden}
        width={width}
        height={h}
        className={`object-contain ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }

  // Icon variant — preserve portrait aspect ratio
  const src = resolvedSurface === "dark" ? WHITE_ICON : DARK_ICON;
  const w = Math.round(size * ICON_ASPECT);

  return (
    <img
      src={src}
      alt={imgAlt}
      aria-hidden={ariaHidden}
      width={w}
      height={size}
      className={`object-contain ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
