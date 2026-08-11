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
