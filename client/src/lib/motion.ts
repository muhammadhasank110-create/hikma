import type { Transition } from "framer-motion";

/**
 * Shared motion vocabulary for HIKMA. Values are deliberately short and
 * transform/opacity-only so learning flows remain calm and responsive.
 */
export const motionTokens = {
  duration: {
    instant: 0.01,
    fast: 0.16,
    standard: 0.28,
    deliberate: 0.42,
    shimmer: 1.4,
  },
  distance: {
    subtle: 6,
    standard: 12,
    prominent: 20,
  },
  scale: {
    press: 0.98,
    hover: 1.01,
  },
  easing: {
    enter: [0.22, 1, 0.36, 1] as [number, number, number, number],
    exit: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  spring: {
    type: "spring" as const,
    stiffness: 320,
    damping: 28,
    mass: 0.65,
  },
} as const;

export interface HikmaMotionConfig {
  reduceMotion: boolean;
  transition: Transition;
  enterTransition: Transition;
  spring: Transition;
  page: {
    initial: false | { opacity: number; y: number };
    animate: { opacity: number; y: number };
    exit: { opacity: number; y: number };
  };
  item: {
    initial: false | { opacity: number; y: number };
    animate: { opacity: number; y: number };
  };
  press: { scale: number } | Record<string, never>;
  hover: { y: number; scale: number } | Record<string, never>;
}

/**
 * Produces animation targets that are safe for system and learner-profile
 * reduced-motion preferences. Keep this pure so it is straightforward to test.
 */
export function createHikmaMotionConfig(reduceMotion: boolean): HikmaMotionConfig {
  const transition: Transition = reduceMotion
    ? { duration: motionTokens.duration.instant }
    : { duration: motionTokens.duration.standard, ease: motionTokens.easing.enter };

  return {
    reduceMotion,
    transition,
    enterTransition: reduceMotion
      ? { duration: motionTokens.duration.instant }
      : { duration: motionTokens.duration.deliberate, ease: motionTokens.easing.enter },
    spring: reduceMotion ? { duration: motionTokens.duration.instant } : motionTokens.spring,
    page: {
      initial: reduceMotion ? false : { opacity: 0, y: motionTokens.distance.standard },
      animate: { opacity: 1, y: 0 },
      exit: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -motionTokens.distance.subtle },
    },
    item: {
      initial: reduceMotion ? false : { opacity: 0, y: motionTokens.distance.subtle },
      animate: { opacity: 1, y: 0 },
    },
    press: reduceMotion ? {} : { scale: motionTokens.scale.press },
    hover: reduceMotion ? {} : { y: -2, scale: motionTokens.scale.hover },
  };
}
