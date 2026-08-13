import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useProfile } from "@/contexts/ProfileContext";
import { createHikmaMotionConfig } from "@/lib/motion";

/** Combines OS preference and the learner's persisted HIKMA profile preference. */
export function useHikmaMotion() {
  const systemReducedMotion = useReducedMotion();
  const { profile } = useProfile();
  return createHikmaMotionConfig(Boolean(systemReducedMotion || profile.reduceMotion));
}

/** Keeps non-essential animation work out of background browser tabs. */
export function useDocumentVisibility() {
  const [isVisible, setIsVisible] = useState(() => (
    typeof document === "undefined" || document.visibilityState !== "hidden"
  ));

  useEffect(() => {
    const updateVisibility = () => setIsVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return isVisible;
}

/** Conservative client-only signal for disabling non-essential ambient animation. */
export function useLowCapabilityDevice() {
  const [isLowCapability, setIsLowCapability] = useState(false);

  useEffect(() => {
    const navigatorWithHints = navigator as Navigator & { deviceMemory?: number };
    const lowMemory = typeof navigatorWithHints.deviceMemory === "number" && navigatorWithHints.deviceMemory <= 2;
    const lowCpuWithoutMemoryHint = navigatorWithHints.deviceMemory === undefined && navigator.hardwareConcurrency <= 4;
    setIsLowCapability(lowMemory || lowCpuWithoutMemoryHint);
  }, []);

  return isLowCapability;
}
