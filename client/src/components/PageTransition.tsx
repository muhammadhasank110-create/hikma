/**
 * PageTransition — wraps page content with a 200ms fade + 8px rise.
 * Respects prefers-reduced-motion AND profile.reduceMotion.
 * Usage: wrap the outermost element of each page with <PageTransition>.
 */
import { Children, isValidElement, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/contexts/ProfileContext";
import { motionTokens } from "@/lib/motion";
import { useHikmaMotion } from "@/hooks/useHikmaMotion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const motionConfig = useHikmaMotion();

  if (motionConfig.reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={motionConfig.page.initial}
      animate={motionConfig.page.animate}
      exit={motionConfig.page.exit}
      transition={motionConfig.transition}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerList — stagger-animates children on first mount only.
 * Re-renders do NOT re-stagger (key is stable).
 */
interface StaggerListProps {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
}

export function StaggerList({ children, className, staggerMs = 40 }: StaggerListProps) {
  const motionConfig = useHikmaMotion();
  const items = Children.toArray(children);

  if (motionConfig.reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: Math.min(staggerMs / 1000, 0.08) } },
      }}
    >
      {items.map((child, index) => (
        <motion.div
          key={isValidElement(child) && child.key !== null ? child.key : `staggered-item-${index}`}
          variants={{
            hidden: { opacity: 0, y: motionTokens.distance.subtle },
            visible: { ...motionConfig.item.animate, transition: motionConfig.transition },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * AnimatedProgress — animates a progress bar from its previous value to the new one.
 */
interface AnimatedProgressProps {
  value: number; // 0–100
  className?: string;
  barClassName?: string;
  "aria-label"?: string;
}

export function AnimatedProgress({ value, className, barClassName, "aria-label": ariaLabel }: AnimatedProgressProps) {
  const { locale } = useProfile();
  const motionConfig = useHikmaMotion();
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={["w-full h-2 bg-muted rounded-full overflow-hidden", className].filter(Boolean).join(" ")}
    >
      <motion.div
        className={["h-full bg-primary rounded-full", barClassName].filter(Boolean).join(" ")}
        initial={motionConfig.reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: clampedValue / 100 }}
        transition={motionConfig.reduceMotion
          ? { duration: motionTokens.duration.instant }
          : { duration: motionTokens.duration.deliberate, ease: motionTokens.easing.enter }}
        style={{ transformOrigin: locale === "ar" ? "right" : "left" }}
      />
    </div>
  );
}
