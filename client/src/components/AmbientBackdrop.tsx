import { motion } from "framer-motion";
import { useDocumentVisibility, useHikmaMotion, useLowCapabilityDevice } from "@/hooks/useHikmaMotion";

type AmbientBackdropProps = {
  variant?: "forest" | "clay" | "sage";
};

const palette = {
  forest: ["bg-emerald-900/14", "bg-lime-300/10", "bg-amber-200/20"],
  clay: ["bg-rose-900/12", "bg-orange-300/13", "bg-amber-100/24"],
  sage: ["bg-emerald-800/10", "bg-teal-300/10", "bg-lime-100/28"],
};

/** Decorative depth only: it never carries content and is disabled when motion is reduced. */
export function AmbientBackdrop({ variant = "forest" }: AmbientBackdropProps) {
  const motionConfig = useHikmaMotion();
  const isVisible = useDocumentVisibility();
  const isLowCapability = useLowCapabilityDevice();
  const [first, second, third] = palette[variant];
  const animate = !motionConfig.reduceMotion && !isLowCapability && isVisible;

  return (
    <div aria-hidden="true" data-ambient-backdrop className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(255,255,255,0.9),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.7),rgba(246,248,243,0.94)_55%,rgba(235,242,234,0.88))]" />
      <div className="ambient-grid absolute inset-0 opacity-50" />
      <motion.div
        className={`absolute -right-20 top-14 size-[22rem] rounded-full blur-2xl will-change-transform ${first}`}
        initial={false}
        animate={animate ? { x: [0, -34, 12, 0], y: [0, 18, -20, 0], scale: [1, 1.06, 0.98, 1] } : { x: 0, y: 0, scale: 1 }}
        transition={{ duration: 20, repeat: animate ? Infinity : 0, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute -left-20 top-[30rem] hidden size-[20rem] rounded-full blur-2xl will-change-transform md:block ${second}`}
        initial={false}
        animate={animate ? { x: [0, 28, -14, 0], y: [0, -20, 14, 0], scale: [1, 0.96, 1.05, 1] } : { x: 0, y: 0, scale: 1 }}
        transition={{ duration: 24, repeat: animate ? Infinity : 0, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute bottom-[-12rem] right-[22%] hidden size-[18rem] rounded-full blur-2xl will-change-transform lg:block ${third}`}
        initial={false}
        animate={animate ? { x: [0, 18, -8, 0], y: [0, -14, 8, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 18, repeat: animate ? Infinity : 0, ease: "easeInOut" }}
      />
    </div>
  );
}
