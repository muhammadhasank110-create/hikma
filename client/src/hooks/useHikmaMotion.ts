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
