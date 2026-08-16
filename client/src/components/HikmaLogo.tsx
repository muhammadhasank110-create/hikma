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
 *   <HikmaLogo />                           → icon, auto-detects surface from theme
 *   <HikmaLogo variant="compact" />         → icon with consistent HIKMA / حكمة wordmark
 *   <HikmaLogo variant="full" width={200} /> → approved full falcon-and-wordmark asset
 */
import { useTheme } from "@/contexts/ThemeContext";

type Surface = "dark" | "light" | "auto";
type Variant = "icon" | "compact" | "wordmark" | "full";

interface HikmaLogoProps {
  surface?: Surface;
  variant?: Variant;
  className?: string;
  /** Extra classes for the image only, useful for responsive visual sizing. */
  imageClassName?: string;
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

export const HIKMA_LOGO_ASPECTS = {
  icon: ICON_ASPECT,
  full: WORDMARK_ASPECT,
} as const;

export function getHikmaLogoAsset(surface: "dark" | "light", variant: "icon" | "full") {
  if (variant === "full") return surface === "dark" ? WHITE_WORDMARK : DARK_WORDMARK;
  return surface === "dark" ? WHITE_ICON : DARK_ICON;
}

export function resolveHikmaLogoSurface(surface: Surface, theme: string): "dark" | "light" {
  return surface === "auto" ? DARK_SURFACE_THEMES.has(theme) ? "dark" : "light" : surface;
}

export function HikmaLogo({
  surface = "auto",
  variant = "icon",
  className = "",
  imageClassName = "",
  size = 48,
  width = 180,
  alt,
  decorative = false,
}: HikmaLogoProps) {
  const { theme } = useTheme();

  const resolvedSurface = resolveHikmaLogoSurface(surface, theme);

  const imgAlt = decorative ? "" : (alt ?? "Hikma");
  const ariaHidden = decorative ? true : undefined;

  const fullVariant = variant === "wordmark" || variant === "full";
  const src = getHikmaLogoAsset(resolvedSurface, fullVariant ? "full" : "icon");
  const sharedImageClass = `block max-w-full object-contain ${imageClassName}`;

  if (variant === "compact") {
    const textClass = resolvedSurface === "dark" ? "text-white" : "text-emerald-950";
    const mutedTextClass = resolvedSurface === "dark" ? "text-white/70" : "text-emerald-950/65";
    const w = Math.round(size * ICON_ASPECT);
    return (
      <span
        className={`inline-flex min-w-0 items-center gap-3 ${className}`}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : imgAlt}
        aria-hidden={decorative || undefined}
        data-hikma-logo="compact"
      >
        <img src={src} alt="" aria-hidden="true" width={w} height={size} className={sharedImageClass} loading="eager" decoding="async" />
        <span className="flex min-w-0 flex-col leading-none" aria-hidden="true">
          <strong className={`text-sm font-bold tracking-[0.2em] ${textClass}`}>HIKMA</strong>
          <span className={`mt-1 text-xs font-medium tracking-[0.08em] ${mutedTextClass}`}>حكمة</span>
        </span>
      </span>
    );
  }

  if (fullVariant) {
    const h = Math.round(width / WORDMARK_ASPECT);
    return (
      <img
        src={src}
        alt={imgAlt}
        aria-hidden={ariaHidden}
        width={width}
        height={h}
        className={`${sharedImageClass} ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }

  // Icon variant — preserve portrait aspect ratio.
  const w = Math.round(size * ICON_ASPECT);

  return (
    <img
      src={src}
      alt={imgAlt}
      aria-hidden={ariaHidden}
      width={w}
      height={size}
      className={`${sharedImageClass} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
