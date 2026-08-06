/**
 * PageTransition — wraps page content with a 200ms fade + 8px rise.
 * Respects prefers-reduced-motion AND profile.reduceMotion.
 * Usage: wrap the outermost element of each page with <PageTransition>.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useProfile } from "@/contexts/ProfileContext";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const systemReducedMotion = useReducedMotion();
  const { profile } = useProfile();
  const reduceMotion = systemReducedMotion || profile.reduceMotion;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
  children: React.ReactNode[];
  className?: string;
  staggerMs?: number;
}

export function StaggerList({ children, className, staggerMs = 40 }: StaggerListProps) {
  const systemReducedMotion = useReducedMotion();
  const { profile } = useProfile();
  const reduceMotion = systemReducedMotion || profile.reduceMotion;

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerMs / 1000 } },
      }}
    >
      {children.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 6 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
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
  const systemReducedMotion = useReducedMotion();
  const { profile } = useProfile();
  const reduceMotion = systemReducedMotion || profile.reduceMotion;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={["w-full h-2 bg-muted rounded-full overflow-hidden", className].filter(Boolean).join(" ")}
    >
      <motion.div
        className={["h-full bg-primary rounded-full", barClassName].filter(Boolean).join(" ")}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
