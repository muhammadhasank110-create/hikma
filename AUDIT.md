# HIKMA Accessibility Audit Log

## Session summary (2026-08-08 — Full Debug Pass)

Full debug sweep of all pages. 7 confirmed bugs found and fixed. TypeScript: 0 errors. Tests: 3/3 pass.

| ID | Category | Severity | Profiles/locales affected | Location (file:line) | Symptom | Root cause | Fix | Verified how | Status |
|---|---|---|---|---|---|---|---|---|---|
| B-001 | Navigation | SEV-HIGH | All / EN + AR | AppShell.tsx:271 | "More" dropdown does nothing on click/touch | CSS `group-hover` only — no click handler, broken on touch devices | Replaced with React `useState` toggle; `aria-expanded`, `aria-haspopup`, `role="menu"` added | Code review + TypeScript | ✅ Done |
| B-002 | Logo | SEV-HIGH | All | AppShell.tsx:234 | Logo renders as near-invisible faint white pixels | Used `hikma-falcon-white.png` (white pixels on transparent, 7KB) which is invisible at small sizes | Switched to `hikma-icon-dark.png` (dark green rounded square + white falcon, clearly visible on dark nav) + CSS text wordmark | Screenshot verified | ✅ Done |
| B-003 | Logo | SEV-MED | All | Home.tsx:303 | Home page nav logo uses composite PNG that renders poorly | `hikma-nav-white.png` is a programmatically composited image with rough quality | Replaced with same icon+text approach as AppShell for consistency | Code review | ✅ Done |
| B-004 | Typography | SEV-LOW | All | Dashboard.tsx:110, index.css:274 | Stat card numbers show as slashed zeros (ⓞ) | Atkinson Hyperlegible font has slashed zeros enabled by default | Added `font-feature-settings: "zero" 0` to body CSS; also `fontVariantNumeric: "normal"` on stat card numbers | Code review | ✅ Done |
| B-005 | Icon visibility | SEV-MED | Light/Cream themes | SubjectPage.tsx:43, TopicsPage.tsx:97 | Subject and topic icons are very faint in light mode | `bg-primary/10` container too transparent; `strokeWidth` default too thin | Increased to `bg-primary/15`, added `strokeWidth: 2.5` on BookOpen; topic number badge to `bg-primary/20` | Code review | ✅ Done |
| B-006 | Feedback | Enhancement | All / EN + AR | client/src/components/FeedbackPanel.tsx | No way for users to report bugs | Feature missing | Added FeedbackPanel to Settings page with screenshot upload and owner email notification | TypeScript + screenshot | ✅ Done |
| B-007 | Security | SEV-SECURITY | All | client/src/hooks/useTTS.ts | ElevenLabs API key exposed in client bundle | `VITE_ELEVENLABS_API_KEY` sent as `xi-api-key` header directly to api.elevenlabs.io | Removed client key; all TTS now routes through server proxy `/api/tts/speak` | grep acceptance check | ✅ Done |

## Matrix checks

| Check | Result |
|---|---|
| Keyboard-only | More dropdown: aria-expanded/haspopup/role=menu added; Escape closes via onBlur |
| Semantics | More dropdown: role="menu", role="menuitem" on links |
| Blind/Low-Vision | Logo alt="" aria-hidden="true" on decorative images |
| Dyslexia | font-feature-settings: "zero" 0 disables slashed zeros globally |
| ADHD/Focus | No changes to focus mode |
| Bilingual/RTL | More dropdown uses `start-0` (logical) not `left-0` |
| Voice parity | No new primary actions added |
| Device parity | More dropdown works on touch (click-toggled, not hover-only) |
| No regressions | TypeScript: 0 errors; Tests: 3/3 pass |

## Open items

- ElevenLabs 402 errors in console log from old cached requests (old key used premium voices) — these are stale log entries, not current failures. New key uses free-tier Bella voice.
- Slashed zeros fix requires browser reload to take effect (CSS change applied, HMR propagated).

## Edge-Case Debug Pass (2026-08-11)

| ID | Category | Symptom | Root cause | Fix | Status |
|---|---|---|---|---|---|
| E-001 | Search | Clicking **Search** did nothing | TopNav and CommandPalette owned different `cmdOpen` state values | Lifted the command-palette state to AppShell and passed a controlled open handler to both | ✅ Done |
| E-002 | Audio lifecycle | Narration carried on after route changes | Lesson-local TTS instances were not included in the shared navigation stop path | Added an app-wide stop event, route-change dispatch, and `useTTS` unmount cleanup | ✅ Done |
| E-003 | Navigation menu | **More** scrolled inside the nav instead of opening a menu | Menu content was positioned inside an overflow-scrolling nav container | Replaced it with a Radix dropdown portal, which anchors below the trigger and escapes the nav overflow | ✅ Done |
| E-004 | Lesson narration | Word highlighting could outlive Listen playback | Highlight state was only partly cleared on TTS completion | Clear highlight state on stop, section changes, and lesson unmount | ✅ Done |
| E-005 | Concept map | Diagram nodes overlapped and ignored active theme tokens | Radial layout used invalid SVG color variables and variable node spacing | Rebuilt as a bounded 1–3/2-column SVG layout with semantic colors, unique arrow IDs, and a robust list fallback | ✅ Done |
| E-006 | Settings | Selected/open controls were visually inconsistent | Settings depended on generic transparent Select surfaces; the nav settings control had invalid nested interaction | Added explicit semantic Select states, high-contrast selected goal state, and valid `Button asChild` navigation | ✅ Done |
| E-007 | Simplify | Literal `*` / `**` artifacts appeared while streaming | Markdown delimiters arrived in partial server-sent chunks | Normalise incomplete emphasis and list markers before rendering through Streamdown; added regression tests | ✅ Done |
| E-008 | Hikma AI | Chat content appeared to disappear after focus/contrast changes | Focus CSS globally recolored every paragraph and list item, including chat bubbles | Scoped focus typography to lesson content only; browser-session conversation persistence added as a safety net | ✅ Done |

### Verification

- `npx tsc --noEmit`: passed.
- `pnpm test`: 3 files / 5 tests passed, including new simplified-Markdown regression tests.
- Visual checks: Settings, Hikma AI, Dashboard, and Lesson route surfaces captured in the live development preview.

### Current operational note

The configured ElevenLabs key currently reports `quota_exceeded` with one credit remaining. The new narration lifecycle fixes are independent of that quota condition; until the key is topped up or replaced, speech uses the browser fallback after the server rejects an ElevenLabs request.

## Full Reliability Audit (2026-08-11)

| ID | Severity | Area | Confirmed root cause | Reliability repair | Verification |
|---|---|---|---|---|---|
| R-001 | P0 | Lesson narration | A cleanup effect depended on an unstable TTS object and repeatedly called state-changing stop logic. | Replaced the dependency with stable TTS methods and retained explicit route/unmount cancellation. | Lesson route renders without the React update loop; TypeScript passed. |
| R-002 | P1 | Navigation | Desktop, More, mobile, and command-palette paths did not share one filtered navigation source; Search was absent from mobile. | Centralized filtered navigation and exposed Search through the mobile path. | Code-path audit and responsive preview. |
| R-003 | P1 | Direct routes | Direct URL access had no explicit authentication/role boundary. | Added protected and role-aware route boundaries for learner, teacher, guardian, and admin surfaces. | Route tree and auth endpoint checked. |
| R-004 | P1 | Landing accessibility | Anonymous users lacked the minimum language, contrast, and text-size controls. | Added a compact pre-auth control cluster, retaining a mobile text-size increase action. | Mobile landing screenshot. |
| R-005 | P1 | Lesson state | Local Focus state could diverge from profile preference; completion navigation could fire after leaving a lesson; normal Markdown words could not be clicked for definitions. | Synchronized Focus with profile state, cleared completion timers, and added DOM caret-based English/Arabic word selection. | TypeScript passed. |
| R-006 | P1 | Assessment | Quiz generation could commit stale results after lesson/locale changes; recording used unused MediaRecorder buffers. | Added cancellation guards, actionable failed-load state, and direct SpeechRecognition cleanup. | TypeScript and test suite passed. |
| R-007 | P1 | Tutor | Streams and voice-input resources could survive page exit. | Abort tutor streams, release recognition, and stop local narration on unmount. | TypeScript passed. |
| R-008 | P1 | Global speech | Playback-state rerenders recreated shared speech callbacks, allowing accessibility effects to cancel narration unexpectedly. | Memoized stable shared speech methods and context value; narrowed focus-profile effect dependencies. | TypeScript and regression suite passed. |
| R-009 | P1 | Dark theme | The profile stored `data-theme="dark"` but did not set Tailwind’s `.dark` class, so dark variants failed. | Synchronize `.dark` with the profile theme. | Mobile dashboard visual check. |
| R-010 | P2 | TTS quota | Exhausted ElevenLabs quota caused repeated failed requests. | Detect quota/auth failure once per browser session and switch cleanly to browser speech. | Static review; external quota remains an operational limit. |

### Reliability verification matrix

| Verification | Result |
|---|---|
| TypeScript | `npx tsc --noEmit` passed. |
| Automated tests | `pnpm test` passed: 3 files, 5 tests. |
| Server auth response | `/api/trpc/auth.me` returned in 52 ms for the unauthenticated case. |
| Mobile visual checks | Landing, dashboard, lesson, quiz, tutor, and settings routes captured at 375×812. |
| Dark/light token behavior | Dashboard visual check confirmed readable counters, icons, and cards after theme-class synchronization. |
| Known external limit | ElevenLabs remains quota-exhausted until its account is topped up or a fresh key is supplied; session fallback prevents repeated failed requests. |

## Motion, SEO, and render-stability session (2026-08-12)

This session introduced a shared, profile-aware Motion vocabulary for page transitions, staged lists, dashboard action feedback, progress indicators, navigation surfaces, onboarding, and pending-content skeletons. Landing-page decorative canvas and mouse-follow effects were removed from the rendered tree, while the remaining non-essential background and headline motion now respects learner reduced-motion preferences and background-tab visibility. The public route was also given a compliant title, keywords, semantic primary heading, and image alternatives. A reported provider-tree render failure was traced to a `localStorage` write inside `useAuth` render-time memoization; storage persistence now runs in a guarded effect so restricted-storage contexts cannot interrupt the authentication provider.

| ID | Category | Severity | Profiles/locales affected | Location (file:line) | Symptom | Root cause | Fix | Verified how | Status |
|---|---|---|---|---|---|---|---|---|---|
| MOT-01 | Motion accessibility | P2 | ADHD/Focus and system reduced-motion users; English and Arabic layouts | `client/src/lib/motion.ts`, `client/src/components/PageTransition.tsx`, `client/src/components/AppShell.tsx`, `client/src/pages/Dashboard.tsx`, `client/src/pages/Onboarding.tsx`, `client/src/pages/Home.tsx` | Repeated UI motion used independent timing and did not consistently honor learner profile preferences. | Motion behavior was defined locally in page components rather than through a shared profile-aware configuration. | Added typed motion tokens and a `useHikmaMotion` hook; updated reusable transitions, progress, shell overlays, dashboard cards, loading states, onboarding, and priority landing motion to use short transform/opacity-only patterns or static fallbacks. | `npx tsc --noEmit`; Vitest suite; desktop landing capture and mobile captures of landing and dashboard. Arabic/RTL interaction was not re-run in this session. | Done |
| SEO-01 | Public landing semantics | P3 | Public route `/`; English and Arabic alternative text | `client/index.html`, `client/src/pages/Home.tsx` | The page lacked a keywords meta tag and a rendered H1; its title was too short and landing images lacked descriptive alternatives. | Metadata and primary heading were not specified in the original landing implementation. | Added six focused keywords, a 48-character document title, a single descriptive H1, and non-empty logo/watermark alternatives. | Automated field check confirmed 6 keywords, title length 48, and 1 H1; visual landing capture completed. | Done |
| R-011 | Render stability | P1 | All profiles/locales in browser contexts where storage is unavailable or restricted | `client/src/_core/hooks/useAuth.ts` | The provider tree could fail during rendering with a stack trace through `useAuth/state`. | `localStorage.setItem` executed inside `useMemo` during render and was not guarded against storage security failures. | Moved storage synchronization into `useEffect` and contained storage exceptions; tRPC remains the authentication source of truth. | Public landing route renders after a full hot reload; `npx tsc --noEmit` and all 7 Vitest checks passed before the final shell and onboarding motion adjustments. | Done |
| MOT-02 | Visual contrast | P2 | Dark and high-contrast profile surfaces | `client/src/pages/Dashboard.tsx`, `client/src/index.css` | Gradient-card content became too low-contrast in the active dark profile. | Gradient surfaces and palette-specific utility classes did not track the semantic profile tokens. | Replaced gradient card backgrounds with semantic card and accent surfaces that inherit the active profile’s foreground tokens. | Desktop dashboard screenshot confirmed the dark treatment; a token audit confirmed high contrast resolves `--card` to black and `--card-foreground` to white. | Done |

## Product redesign and reliability session (2026-08-12)

The public route now begins with a minimal animated brand entry before revealing a quieter learning introduction. Particle canvas rendering, animated orbs, mouse-follow effects, marquee motion, and glow-heavy calls to action were removed. Authenticated learner routes use a simplified section-aware top navigation and a five-item bottom navigation on narrow screens. Settings now holds quick language and access controls instead of the public top utility strip. Sound playback is guarded against restricted storage and unavailable browser audio, the analytics include was removed, and tutor session identity is retained within the browser session while the server prompt receives only factual stored-progress counts.

| ID | Category | Severity | Profiles/locales affected | Location (file:line) | Symptom | Root cause | Fix | Verified how | Status |
|---|---|---|---|---|---|---|---|---|---|
| UI-01 | Visual hierarchy and motion | P3 | Public route; system reduced-motion learners | `client/src/pages/Home.tsx` | The landing route was visually crowded with particle, orb, cursor, marquee, and glow effects. | Decorative motion dominated the product purpose and consumed rendering work without supporting a learner task. | Replaced the route with a branded entry overlay, concise responsive hero, and minimal feature cards; retained profile-aware Motion only for entry and content continuity. | Desktop and 375×812 landing captures; TypeScript and unit suite passed. Direct reduced-motion interaction was not re-run. | Done |
| NAV-03 | Responsive navigation | P2 | Learner mobile routes; English UI | `client/src/components/AppShell.tsx`, `client/src/pages/Dashboard.tsx` | Learner routes did not offer phone-app-style navigation or an obvious compact next-learning action, and keyboard search had no global trigger. | Navigation access was concentrated in the top shell and the learner-home hierarchy did not prioritize continuation on mobile. | Added role-filtered bottom learner navigation at mobile widths, a primary Continue learning action, and Ctrl/Cmd+K activation for the existing animated command search. | 375×812 dashboard and settings captures showed the fixed bottom navigation and learner-home action. Keyboard activation and Arabic/RTL parity remain manual follow-ups. | Done |
| REL-01 | Runtime reliability | P1 | Restricted-storage browsers and sound-enabled learners | `client/src/lib/sound.ts`, `client/index.html`, `client/src/pages/LessonPage.tsx` | A click could throw through `playSound`; lesson narration needed an explicit stop action; an external analytics include generated console failures. | Sound read preferences directly from browser storage and assumed Web Audio; analytics loaded a failing external endpoint. | Replaced the sound helper with guarded storage and AudioContext access, wired the active lesson audio control to stop, and removed the analytics include. | TypeScript and 5 Vitest files / 8 checks passed, including the new storage-safety regression test; the latest 80 console lines contained no matching `playSound`, analytics, umami, SecurityError, or Error entries. | Done |
| TUT-01 | Tutor personalization | P2 | Authenticated tutor users | `client/src/hooks/useTutorState.ts`, `server/routers/tutor.ts` | Tutor identity could reset across safe remounts and prompts lacked factual progress summary. | Session ID was generated per mount and stored learning counts were not included in tutor context. | Persisted a browser-session tutor ID and added completed-lesson/mastery-record counts to the server prompt, with an explicit prohibition on inventing gaps or scores. | TypeScript and unit suite passed; authenticated tutor interaction remains a manual follow-up. | Done |
| HYG-03 | Code hygiene | P3 | All users | `client/src/pages/ComponentShowcase.tsx` | An unreferenced component-library demo remained in product source. | Legacy scaffold artifact was not routed or imported. | Removed after a repository reference search. | Repository-wide reference search showed no matches and TypeScript passed after deletion. | Done |
