import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export type LearnerMode = "audio_first" | "reading" | "focus" | "custom";
export type HikmaTheme = "light" | "dark" | "cream" | "calm" | "high_contrast";
export type FontFamily = "atkinson" | "plex" | "opendyslexic" | "naskh";
export type Locale = "ar" | "en";

export interface LearnerProfileState {
  mode: LearnerMode;
  primaryModality: "audio" | "text" | "visual";
  autoNarrate: boolean;
  speechRate: number;
  voice: string;
  earcons: boolean;
  theme: HikmaTheme;
  fontFamily: FontFamily;
  fontScale: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  maxLineLength: number;
  rulerOverlay: boolean;
  overlayTint: "none" | "blue" | "yellow" | "peach" | "green" | "grey";
  overlayOpacity: number;
  chunkSize: "micro" | "standard";
  reduceMotion: boolean;
  hideDecorative: boolean;
  timers: boolean;
  bodyDouble: boolean;
  rewards: "off" | "gentle" | "full";
  readingLevel: 1 | 2 | 3;
  tashkeel: boolean;
  numerals: "arabic_indic" | "western";
  syllableSplit: boolean;
  curriculum: string;
  subjectInterests: string[];
  learningMethods: Array<"visual" | "reading" | "audio" | "practice">;
  learningGoals: Array<"understand" | "homework" | "exam" | "revision" | "fundamentals" | "practice" | "independent">;
  explanationPreference: "quick" | "balanced" | "detailed" | "step_by_step";
  practicePreference: "short" | "mixed" | "exam_style" | "step_by_step";
  sessionPreference: "short" | "medium" | "long";
  tier: string | null;
  eccEnabled: boolean;
  inputMethod: "keyboard" | "pointer" | "switch" | "voice" | "braille_display";
  singleKeyShortcuts: boolean;
  onboardingComplete: boolean;
  dailyGoalMinutes: number;
}

const defaultProfile: LearnerProfileState = {
  mode: "reading",
  primaryModality: "text",
  autoNarrate: false,
  speechRate: 1.0,
  voice: "alloy",
  earcons: true,
  theme: "light",
  fontFamily: "atkinson",
  fontScale: 1.0,
  lineHeight: 1.7,
  letterSpacing: 0,
  wordSpacing: 0,
  maxLineLength: 65,
  rulerOverlay: false,
  overlayTint: "none",
  overlayOpacity: 0.35,
  chunkSize: "standard",
  reduceMotion: false,
  hideDecorative: false,
  timers: false,
  bodyDouble: false,
  rewards: "gentle",
  readingLevel: 2,
  tashkeel: false,
  numerals: "western",
  syllableSplit: false,
  curriculum: "none",
  subjectInterests: [],
  learningMethods: [],
  learningGoals: [],
  explanationPreference: "balanced",
  practicePreference: "mixed",
  sessionPreference: "medium",
  tier: null,
  eccEnabled: false,
  inputMethod: "keyboard",
  singleKeyShortcuts: true,
  onboardingComplete: false,
  dailyGoalMinutes: 20,
};

interface ProfileContextValue {
  profile: LearnerProfileState;
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  updateProfile: (updates: Partial<LearnerProfileState>) => void;
  updateProfileAsync: (updates: Partial<LearnerProfileState>) => Promise<void>;
  setMode: (mode: LearnerMode) => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: defaultProfile,
  locale: "en",
  dir: "ltr",
  setLocale: () => {},
  updateProfile: () => {},
  updateProfileAsync: async () => {},
  setMode: () => {},
  isLoading: false,
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<LearnerProfileState>(defaultProfile);
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    return new URLSearchParams(window.location.search).get("lang") === "ar" ? "ar" : "en";
  });
  const [isLoading, setIsLoading] = useState(false);

  const dir = locale === "ar" ? "rtl" : "ltr";

  // Load profile from DB when authenticated
  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    // Never auto-refetch — we manage state optimistically in updateProfile.
    // Only refetch on explicit invalidation (e.g. after mutation error).
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const utils = trpc.useUtils();
  const updateProfileMutation = trpc.profile.update.useMutation({
    // IMPORTANT: Do NOT invalidate the profile query on success.
    // We update local state optimistically in updateProfile() below.
    // Invalidating causes a refetch → useEffect fires → setProfile → full re-render → scroll reset.
    onSuccess: () => {
      // Cancel any in-flight refetch so the optimistic local state wins
      utils.profile.get.cancel();
    },
    onError: (_err, variables) => {
      // On error, re-fetch to restore server state
      utils.profile.get.invalidate();
    },
  });

  // Merge DB profile into local state when it loads or user changes
  useEffect(() => {
    if (!profileQuery.data) return;
    const db = profileQuery.data as any;
    setProfile(prev => ({
      ...prev,
      ...(db.mode && { mode: db.mode }),
      ...(db.primaryModality && { primaryModality: db.primaryModality }),
      ...(db.autoNarrate != null && { autoNarrate: Boolean(db.autoNarrate) }),
      ...(db.speechRate != null && { speechRate: Number(db.speechRate) }),
      ...(db.voice && { voice: db.voice }),
      ...(db.earcons != null && { earcons: Boolean(db.earcons) }),
      ...(db.theme && { theme: db.theme }),
      ...(db.fontFamily && { fontFamily: db.fontFamily }),
      ...(db.fontScale != null && { fontScale: Number(db.fontScale) }),
      ...(db.lineHeight != null && { lineHeight: Number(db.lineHeight) }),
      ...(db.letterSpacing != null && { letterSpacing: Number(db.letterSpacing) }),
      ...(db.wordSpacing != null && { wordSpacing: Number(db.wordSpacing) }),
      ...(db.maxLineLength != null && { maxLineLength: Number(db.maxLineLength) }),
      ...(db.rulerOverlay != null && { rulerOverlay: Boolean(db.rulerOverlay) }),
      ...(db.overlayTint && { overlayTint: db.overlayTint }),
      ...(db.overlayOpacity != null && { overlayOpacity: Number(db.overlayOpacity) }),
      ...(db.chunkSize && { chunkSize: db.chunkSize }),
      ...(db.reduceMotion != null && { reduceMotion: Boolean(db.reduceMotion) }),
      ...(db.hideDecorative != null && { hideDecorative: Boolean(db.hideDecorative) }),
      ...(db.timers != null && { timers: Boolean(db.timers) }),
      ...(db.bodyDouble != null && { bodyDouble: Boolean(db.bodyDouble) }),
      ...(db.rewards && { rewards: db.rewards }),
      ...(db.readingLevel != null && { readingLevel: Number(db.readingLevel) as 1|2|3 }),
      ...(db.tashkeel != null && { tashkeel: Boolean(db.tashkeel) }),
      ...(db.numerals && { numerals: db.numerals }),
      ...(db.syllableSplit != null && { syllableSplit: Boolean(db.syllableSplit) }),
      ...(db.curriculum && { curriculum: db.curriculum }),
      ...(Array.isArray(db.subjectInterests) && { subjectInterests: db.subjectInterests }),
      ...(Array.isArray(db.learningMethods) && { learningMethods: db.learningMethods }),
      ...(Array.isArray(db.learningGoals) && { learningGoals: db.learningGoals }),
      ...(db.explanationPreference && { explanationPreference: db.explanationPreference }),
      ...(db.practicePreference && { practicePreference: db.practicePreference }),
      ...(db.sessionPreference && { sessionPreference: db.sessionPreference }),
      ...(db.tier !== undefined && { tier: db.tier }),
      ...(db.eccEnabled != null && { eccEnabled: Boolean(db.eccEnabled) }),
      ...(db.inputMethod && { inputMethod: db.inputMethod }),
      ...(db.singleKeyShortcuts != null && { singleKeyShortcuts: Boolean(db.singleKeyShortcuts) }),
      ...(db.onboardingComplete != null && { onboardingComplete: Boolean(db.onboardingComplete) }),
      ...(db.dailyGoalMinutes != null && { dailyGoalMinutes: Number(db.dailyGoalMinutes) }),
    }));
    if (db.locale) setLocaleState(db.locale as Locale);
  }, [profileQuery.data]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", profile.theme);
    root.classList.toggle("dark", profile.theme === "dark");
    root.setAttribute("data-font", profile.fontFamily);
    root.style.setProperty("--font-scale", String(profile.fontScale));
    root.style.setProperty("--user-line-height", String(profile.lineHeight));
    root.style.setProperty("--user-letter-spacing", `${profile.letterSpacing}em`);
    root.style.setProperty("--user-word-spacing", `${profile.wordSpacing}em`);
    root.style.setProperty("--user-measure", `${profile.maxLineLength}ch`);
    root.style.fontSize = `${profile.fontScale * 100}%`;
    if (profile.reduceMotion) {
      root.style.setProperty("--duration-fast", "0ms");
      root.style.setProperty("--duration-base", "0ms");
      root.style.setProperty("--duration-slow", "0ms");
    } else {
      root.style.removeProperty("--duration-fast");
      root.style.removeProperty("--duration-base");
      root.style.removeProperty("--duration-slow");
    }
    // ── Task 2: Target size — larger hit areas for accessibility profiles ──────
    // audio_first = blind/low-vision, opendyslexic = dyslexia, reduceMotion = ADHD
    const needsLargeTargets =
      profile.mode === "audio_first" ||
      profile.fontFamily === "opendyslexic" ||
      profile.reduceMotion;
    root.style.setProperty("--target-min", needsLargeTargets ? "56px" : "44px");
    root.style.setProperty("--target-gap", needsLargeTargets ? "12px" : "8px");
    root.setAttribute("data-large-targets", needsLargeTargets ? "true" : "false");
  }, [profile]);

  // Apply locale/direction to document
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("dir", dir);
  }, [locale, dir]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (isAuthenticated) {
      updateProfileMutation.mutate({ locale: newLocale } as any);
    }
  };

  const updateProfile = (updates: Partial<LearnerProfileState>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    if (isAuthenticated) {
      updateProfileMutation.mutate(updates as any);
    }
  };

  // Async version — awaits the DB write before resolving.
  // Use this in Onboarding's handleFinish so navigation happens AFTER the DB is updated.
  const updateProfileAsync = async (updates: Partial<LearnerProfileState>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    if (isAuthenticated) {
      await updateProfileMutation.mutateAsync(updates as any);
    }
  };

  const setMode = (mode: LearnerMode) => {
    const modeDefaults: Record<LearnerMode, Partial<LearnerProfileState>> = {
      audio_first: { mode, primaryModality: "audio", autoNarrate: true, earcons: true, theme: "light" },
      reading: { mode, primaryModality: "text", theme: "cream", fontFamily: "atkinson", syllableSplit: false },
      focus: { mode, primaryModality: "text", theme: "calm", chunkSize: "micro", hideDecorative: true, reduceMotion: true },
      custom: { mode },
    };
    updateProfile(modeDefaults[mode]);
  };

  return (
    <ProfileContext.Provider value={{ profile, locale, dir, setLocale, updateProfile, updateProfileAsync, setMode, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
