/**
 * HikmaLogo — single decision point for all logo rendering in Hikma.
 *
 * Two official square PNGs from the user's final brand assets:
 *   cream/forest mark — for LIGHT surfaces
 *   forest/white mark — for DARK surfaces
 *
 * Usage:
 *   <HikmaLogo />                           → icon, auto-detects surface from theme
 *   <HikmaLogo variant="compact" />         → official mark, compactly sized
 *   <HikmaLogo variant="full" width={200} /> → official mark, prominently sized
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
  /** px height for icon variant. Width is calculated from the official square aspect ratio. Defaults to 48. */
  size?: number;
  /** For full: explicit width in px. Height follows the official square aspect ratio. Defaults to 180. */
  width?: number;
  alt?: string;
  decorative?: boolean;
}

const ICON_ASPECT = 1;
const WORDMARK_ASPECT = 1;

const DARK_ICON = "/manus-storage/hikma-logo-official-forest-transparent_95429dc9.png";
const WHITE_ICON = "/manus-storage/hikma-logo-official-cream-transparent_c99c136d.png";

const DARK_SURFACE_THEMES = new Set(["dark", "high_contrast"]);

export const HIKMA_LOGO_ASPECTS = {
  icon: ICON_ASPECT,
  full: WORDMARK_ASPECT,
} as const;

export function getHikmaLogoAsset(surface: "dark" | "light", variant: "icon" | "full") {
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
    const w = Math.round(size * ICON_ASPECT);
    return (
      <span
        className={`inline-flex min-w-0 items-center ${className}`}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : imgAlt}
        aria-hidden={decorative || undefined}
        data-hikma-logo="compact"
      >
        <img src={src} alt="" aria-hidden="true" width={w} height={size} className={sharedImageClass} loading="eager" decoding="async" />
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
