/**
 * useScrollReveal — IntersectionObserver-based scroll reveal.
 * Adds 'revealed' class to elements with 'reveal' class when they enter the viewport.
 * 60ms stagger between siblings.
 */
import { useEffect, useRef } from "react";

export function useScrollReveal(selector = ".reveal") {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Just make everything visible immediately
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add("revealed");
      });
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            // Stagger siblings: find index among siblings with same class
            const parent = el.parentElement;
            if (parent) {
              const siblings = Array.from(parent.querySelectorAll(selector));
              const idx = siblings.indexOf(el);
              el.style.transitionDelay = `${idx * 60}ms`;
            }
            el.classList.add("revealed");
            observerRef.current?.unobserve(el); // fire once only
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(selector).forEach(el => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [selector]);
}
