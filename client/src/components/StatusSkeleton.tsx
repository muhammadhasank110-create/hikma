import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { motionTokens } from "@/lib/motion";
import { useHikmaMotion } from "@/hooks/useHikmaMotion";

interface StatusSkeletonProps {
  className?: string;
}

/**
 * Communicates pending content without looping in hidden tabs or for learners
 * who have asked for reduced motion.
 */
export function StatusSkeleton({ className = "" }: StatusSkeletonProps) {
  const controls = useAnimationControls();
  const { reduceMotion } = useHikmaMotion();

  useEffect(() => {
    if (reduceMotion) {
      controls.stop();
      return;
    }

    const start = () => controls.start({
      x: ["-120%", "120%"],
      transition: {
        duration: motionTokens.duration.shimmer,
        repeat: Infinity,
        ease: "linear",
      },
    });
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") controls.stop();
      else void start();
    };

    void start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      controls.stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [controls, reduceMotion]);

  return (
    <div aria-hidden="true" className={`relative overflow-hidden rounded-2xl bg-muted/45 ${className}`}>
      {!reduceMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-background/70 to-transparent"
          initial={{ x: "-120%" }}
          animate={controls}
          transition={{ duration: motionTokens.duration.deliberate }}
        />
      )}
    </div>
  );
}
