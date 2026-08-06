import React, { createContext, useCallback, useContext, useRef } from "react";

interface AriaLiveContextValue {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AriaLiveContext = createContext<AriaLiveContextValue>({
  announce: () => {},
});

export function AriaLiveProvider({ children }: { children: React.ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const el = priority === "assertive" ? assertiveRef.current : politeRef.current;
    if (!el) return;
    // Clear then set to ensure re-announcement of same message
    el.textContent = "";
    requestAnimationFrame(() => {
      if (el) el.textContent = message;
    });
  }, []);

  return (
    <AriaLiveContext.Provider value={{ announce }}>
      {children}
      {/* Polite live region — non-urgent announcements */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="hikma-live-polite"
      />
      {/* Assertive live region — errors, urgent alerts */}
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
        id="hikma-live-assertive"
      />
      <div id="sound-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />
    </AriaLiveContext.Provider>
  );
}

export function useAriaLive() {
  return useContext(AriaLiveContext);
}

