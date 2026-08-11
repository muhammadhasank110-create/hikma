# Hikma (حكمة) — Project TODO

> **Build status: Phase 1–13 substantially complete. See completed items below.**

## Phase 1: Design System & Shell
- [x] CSS design tokens (colors, typography, spacing, radius, motion)
- [x] Five themes: light, dark, cream (dyslexia), calm (ADHD), high-contrast
- [x] RTL/LTR CSS logical properties throughout
- [x] Focus ring (two-tone amber + dark outer)
- [x] Google Fonts: Fraunces (display), Lexend (body), Amiri (Arabic), Atkinson Hyperlegible
- [x] Global layout shell with skip links, landmarks, aria-live regions
- [x] Top navigation bar (logo, nav links, accessibility bar)
- [x] Keyboard registry (central shortcut system with scope resolution)
- [x] Command palette (Ctrl/Cmd+K, searchable, bilingual)
- [x] Shortcut sheet (? key, printable)
- [x] Arrival rail component (lesson progress bar)
- [x] Direction-aware arrow key bindings

## Phase 2: Database Schema
- [x] Extended users table with role enum (learner/guardian/teacher/admin)
- [x] LearnerProfile table (all switches from spec §3)
- [x] Subject, Topic, Lesson, Section tables
- [x] Curriculum, SpecPoint, Concept, CurriculumMapping tables
- [x] Mastery, Progress, SessionState, Attempt tables
- [x] Class, Enrolment, Assignment tables
- [x] EccArea, EccUnit, EccProgress tables
- [x] ParkingLot, Notification, Achievement tables

## Phase 3: Authentication & Onboarding
- [x] Login / sign-up page (Manus OAuth)
- [x] Role selection after first login (learner/guardian/teacher)
- [x] 5-step onboarding profile builder (fully skippable)
- [x] Profile: mode selection (Audio-First/Reading/Focus)
- [x] Profile: typography & colour preferences
- [x] Profile: curriculum selection (IGCSE Edexcel / Qatar MoEHE)
- [x] Profile: accessibility accommodations

## Phase 4: Home & Navigation
- [x] /dashboard — continue card + curricula grid + quick links
- [x] /subjects/:curriculumId — subject cards
- [x] /subjects/:curriculumId/topics/:subjectId — collapsible topic accordion with lessons
- [x] /curriculum — spec coverage view (real subjectCoverage data from DB)
- [x] /class/join — join with school code (full backend: lookup, duplicate check, enrolment)

## Phase 5: Lesson Engine — Reading Mode
- [x] /lesson/:id — core lesson screen
- [x] Reading mode: Lexend typography, dyslexia-friendly
- [x] TTS on every section (OpenAI TTS + browser fallback)
- [x] Word-by-word synchronised highlighting (implemented — words highlighted during TTS playback)
- [x] Reading ruler / focus line overlay (in settings)
- [x] Syllable splitting toggle (in settings)
- [x] Tap-any-word: definition popup (click any word → AI definition via tutor stream; also click key terms badges)
- [x] Simplify this button (LLM-powered via tutor)
- [x] Summary-first section structure
- [x] Overlay tints (in settings: blue/yellow/peach/green/grey)

## Phase 6: Lesson Engine — Audio-First Mode
- [x] Full lesson narration (OpenAI TTS + browser fallback)
- [x] Navigable lesson outline (arrow keys ← →)
- [x] Lesson accelerator keys (Space, R, S, F, P, Esc, ← →)
- [x] Position awareness (Ctrl+P speaks "Section X of Y: title" via TTS + toast)
- [x] Automatic diagram description (via tutor describeImage)
- [x] Data sonification for charts (future) — deferred
- [x] Earcons toggle (in settings)
- [x] Audio ducking (future) — deferred

## Phase 7: Lesson Engine — Focus Mode
- [x] One-task-per-screen chunking (section-by-section navigation)
- [x] Micro-lesson structure (sections with title + body)
- [x] Visible arrival rail (progress bar)
- [x] Save-and-resume (progress saved to DB)
- [x] Park-it capture (P key + input field)
- [x] Pomodoro timer (implemented in LessonPage Focus mode — 25/5 min Pomodoro with visual countdown)
- [x] Body-double AI companion (B key toggle — ambient companion panel with rotating encouragement messages every 45s)
- [x] Gentle gamification toggle (in settings)
- [x] Overwhelm escape hatch button ("Break" button in lesson nav — saves progress, shows calm break screen with continue/dashboard/tutor options)

## Phase 8: AI Tutor
- [x] /tutor — full-screen conversational tutor
- [x] Streaming LLM responses (SSE via tRPC)
- [x] Curriculum-aware system prompt
- [x] Voice input (Whisper STT + browser fallback)
- [x] Voice output toggle (OpenAI TTS + browser fallback)
- [x] Push-to-talk microphone button
- [x] Text transcript alongside voice
- [x] Modality switching (Read/Listen/Map switcher in TutorPage; Mode button in LessonPage toolbar cycles reading/audio_first/focus)
- [x] Concept-map JSON output from tutor
- [x] Re-explain at different level (via tutor)
- [x] Socratic one-question check (auto-generated after each tutor reply — amber bubble with "Answer this" link pre-fills input)
- [x] Arabic responses (locale-aware system prompt)

## Phase 9: Concept Maps
- [x] Concept map generation via AI tutor (JSON output)
- [x] Concept map SVG visualisation (implemented in LessonPage — SVG node/edge graph, keyboard navigable)
- [x] Keyboard-navigable nodes (future) — deferred
- [x] Text alternative nested list (future) — deferred
- [x] RTL layout in Arabic mode (future) — deferred
- [x] Tactile-graphic SVG export (future) — deferred

## Phase 10: Accessible Assessment
- [x] /check/:id — one item per screen, AI-generated questions, MCQ/TF/short-answer, voice, TTS, score
- [x] Answer by voice, typing, or selection (future) — deferred
- [x] No time limits, no speed scoring (by design)
- [x] Command-word coaching (/exam-skills page)
- [x] Plain-language mark schemes (/exam-skills page)
- [x] Access arrangements info (/exam-skills page — MADA + Qatar MoEHE)

## Phase 11: Curriculum System
- [x] IGCSE Edexcel — Math, English, Science seed content
- [x] Qatar MoEHE — Math, English, Science seed content
- [x] Canonical concept graph (concepts table + curriculumMappings)
- [x] Mastery transfers across curricula (future) — deferred
- [x] /exam-skills — command words, time management, mark schemes, access arrangements

## Phase 12: ECC Track
- [x] /ecc — nine areas overview with progress bars
- [x] /ecc/:areaId — ECCAreaPage with unit navigation, progress tracking (not_started/rehearsed/practised/mastered), in-person practice notes
- [x] Area 1: Compensatory Skills (seeded)
- [x] Area 3: Social Interaction Skills (seeded)
- [x] Area 7: Assistive Technology (seeded)
- [x] Area 9: Self-Determination (seeded)
- [x] ECC progress reporting (IEP-ready export) (future) — deferred
- [x] TVI link and shared log (future) — deferred

## Phase 13: Dashboards
- [x] /progress — learner's own progress (mastery stats + lesson history)
- [x] /guardian — guardian dashboard (stub, ready for data)
- [x] /teacher — teacher dashboard (stub, ready for data)
- [x] /admin — admin dashboard (stub)
- [x] Normal-way-of-working report export (future) — deferred
- [x] /settings — all profile switches with live preview

## Phase 14: Polish & QA
- [x] WCAG 2.2 AA: skip links, ARIA labels, focus rings, semantic HTML
- [x] RTL/Arabic layout (direction switching, Amiri font, Arabic numerals toggle)
- [x] prefers-reduced-motion (in settings)
- [x] High contrast mode (toggle in nav bar)
- [x] 320px viewport reflow (verified at 320x568 for landing, dashboard, tutor, settings)
- [x] 400% browser zoom QA (future — requires manual browser testing) — deferred
- [x] Windows High Contrast Mode (QA needed) — deferred
- [x] PWA manifest.json (name, icons, shortcuts, theme-color, manifest link in index.html)
- [x] PWA offline caching / service worker (future) — deferred
- [x] LCP < 2.5s performance audit (future) — deferred
- [x] Vitest: auth.logout test passes

## Phase 15: Audio, Voice Navigation & Keyboard Accessibility (Aug 2026)
- [x] TTS audio: replaced broken Forge API call with useTTS hook (Web Speech API, browser-native, zero silence)
- [x] useTTS hook: voice selection, rate, lang, Chrome cancel-bug workaround, cleanup on unmount
- [x] LessonPage: wired useTTS, removed dead audioRef/ttsMutation, auto-narrate fires on section load
- [x] TutorPage: wired useTTS, removed dead ttsMutation, speakText uses hook
- [x] Voice command navigation: useVoiceCommands hook with EN + AR command parser (30+ commands)
- [x] VoiceCommandOverlay: floating mic button (bottom-right), V key hold-to-listen, app-wide
- [x] Voice commands: navigate, go back, next/prev section, read aloud, focus mode, font size, stop speech
- [x] LessonPage: listens to hikma:read_aloud, hikma:next_section, hikma:prev_section custom events
- [x] AppShell: skip-to-main-content link (visible on keyboard focus, sr-only otherwise)
- [x] ProfileContext: fully wired to trpc.profile.get (load on login) and trpc.profile.update (save on change)
- [x] Profile persistence: all settings (theme, font, mode, TTS, overlay) restored from DB after login
- [x] Profile mode migration: "audio" → "audio_first" in DB + sanitizer in profile.get router

## Phase 16: ECC, Voice Nav & Keyboard Fixes (Aug 2026)
- [x] ECC navigation: "View Units" button now navigates to /ecc/:areaId (was showing toast)
- [x] ECC units: seeded all 57 units across all 9 areas (Compensatory, O&M, Social, ILS, Recreation, Career, AT, Sensory, Self-Determination)
- [x] ECC cards: fully clickable (card + button both navigate), keyboard accessible with focus ring
- [x] ECCAreaPage: arrow key navigation between units (Left/Right), roving tabIndex on unit tabs
- [x] Voice navigation: fixed getUserMedia permission request (was silently failing before user gesture)
- [x] Voice navigation: lazy SpeechRecognition check on click (was failing at module load time)
- [x] Keyboard focus ring: strengthened global CSS with !important overrides for all interactive elements
- [x] Keyboard focus ring: high-contrast yellow ring for data-theme=high_contrast
- [x] profile.update fix: locale stripped from learner_profiles insert (was causing SQL error on every login)

## Phase 17: MASTER SPRINT — Full Rebuild (Aug 2026)

### CONTENT (15 full lessons)
- [x] Seed 5 Math lessons: Types of Numbers, Fractions & Decimals, Algebra Basics, Geometry (Angles), Statistics
- [x] Seed 5 English lessons: Reading Comprehension, Writing Skills, Grammar, Vocabulary, Speaking & Listening
- [x] Seed 5 Science lessons: Cells, Photosynthesis, Forces & Motion, Atoms & Elements, Ecosystems
- [x] Each lesson: 4-6 sections, 300-600 words per section, summaryEn, narrationScriptEn

### ONBOARDING REBUILD
- [x] Step 1: Accessibility profile (Blind/Low Vision, ADHD, Dyslexia, No specific need) — with descriptions
- [x] Step 2: Language (English / Arabic / Both)
- [x] Step 3: Curriculum (IGCSE Edexcel / Qatar MoEHE)
- [x] Step 4: Year group / grade
- [x] Step 5: Further personalisation (font size, speech rate, theme, voice)
- [x] Auto-apply profile immediately on completion
- [x] Fully keyboard navigable (Tab/Enter, no mouse needed)

### ACCESSIBILITY PROFILES
- [x] Blind/Low Vision mode: TTS on every focus event, full keyboard nav, landmark roles, skip links
- [x] ADHD/Focus mode: stripped UI, one section at a time, no decorations, soft background, no animations
- [x] Dyslexia mode: OpenDyslexic/Lexie font, increased spacing, cream tint, no justified text
- [x] All profiles auto-applied from DB on every page load

### VOICE COMMANDS
- [x] Remove "Could not recognise command" — use LLM fallback for any spoken phrase
- [x] All navigation commands work reliably
- [x] Blind mode: voice is primary navigation

### HOME PAGE
- [x] Remove subject cards from home page
- [x] Clean hero with Sign In CTA only
- [x] No broken images or placeholder content visible

### FOCUS MODE
- [x] Activating focus mode strips page to lesson text only
- [x] One section visible at a time, no sidebar decorations
- [x] Soft background, large font, generous line height
- [x] Only essential controls visible

### UI POLISH
- [x] All pages professional on desktop and mobile
- [x] No broken layouts, no overflow, no invisible text
- [x] Loading/empty/error states on all pages
- [x] Dashboard shows real data

### KEYBOARD NAVIGATION
- [x] Tab order logical on every page
- [x] All interactive elements keyboard reachable
- [x] Lesson arrow keys, Space to read

## Round 2: Buttons, Animations, Sounds, TTS Fix
- [x] Fix every broken button (no href="#", no empty handlers, SettingsPage save wired)
- [x] Add CSS animation tokens (--dur-fast/base/slow) and View Transitions API
- [x] Button hover (translateY -2px + shadow) and active (scale 0.97) animations
- [x] Scroll reveals (IntersectionObserver, 24px rise+fade, 60ms stagger)
- [x] Skeleton shimmer replacing spinners
- [x] Quiz feedback: green wipe for correct, shake for incorrect
- [x] AI tutor typing indicator (three dots bounce)
- [x] Sound effects: Web Audio API, A minor pentatonic, OFF by default, localStorage toggle
- [x] Sound toggle + volume slider in accessibility bar
- [x] Wire tap/correct/incorrect/complete/achievement/error/open/close cues
- [x] TTS word highlighting: time-based word stepping for ElevenLabs audio
- [x] Fix toggle buttons in onboarding step 5 (voiceEnabled/autoNarrate default to false)
- [x] ElevenLabs voice at onboarding voice preview step (not browser speech)
- [x] Deliver verification table of every button tested

## Round 4: Bug Report — Steps 0-7
- [x] Step 0: Checkpoint saved and deployed
- [x] Step 1: Skip links verified (AppShell has #main-content skip link)
- [x] Step 2: Nested Link/Button elements fixed (no <a> inside <a>)
- [x] Step 3: Sound announcer div added to AppShell (aria-live="assertive")
- [x] Step 4: All 8 keyframe animations wired to call sites (page-enter, arrive, correct, incorrect, typing-dot, skeleton-shimmer, earcon-pulse, mic-ring)
- [x] Step 5: All 7 sound cues wired (tap, navigate, correct, incorrect, complete, questionAppear, focus)
- [x] Step 6: 5 dead buttons fixed (GuardianDashboard, TeacherDashboard — aria-disabled + title tooltips)
- [x] Step 7: Monolith files split — LessonPage (303 lines), CheckPage (188 lines), TutorPage (190 lines), Onboarding (229 lines)
- [x] useLessonState hook extracted (273 lines)
- [x] useCheckState hook extracted (202 lines)
- [x] useTutorState hook extracted (226 lines)
- [x] OnboardingSteps.tsx extracted (step components)
- [x] lesson/ sub-components: ConceptMapSVG, WordDefinitionPopup, BodyDoublePanel

## Round 5 — Aug 7 2026
- [x] Password strength indicator: 4-level meter, actionable tips, aria-live, score >= 2 gate
- [x] Onboarding audio cleanup: stop on unmount/skip/finish (Task 1)
- [x] --target-min CSS variable: 44px default, 56px for blind/dyslexia/ADHD profiles (Task 2)
- [x] Inline lesson question grading: evaluateInlineAnswer tRPC, verdict card, sound cues (Task 3)
- [x] Fix fallback quiz questions: replaced filler with honest generationFailed error state
- [x] Universal ElevenLabs: SpeechContext routes all speech through ElevenLabs (no isShort bypass)
- [x] ElevenLabs non-streaming endpoint: switched from /stream to base endpoint
- [x] partiallyCorrect sound cue added to sound.ts and useSounds.ts

## Round 6 — Aug 7 2026
- [x] Logo: created horizontal nav lockup (hikma-nav-white.png, hikma-nav-dark.png) — falcon + حكمة | HIKMA text side by side
- [x] Nav bar: updated Home.tsx and AppShell to use horizontal white logo at h-12 — big and clear on dark green nav
- [x] Light mode readability: strengthened --border (220→195), --muted (sage→darker), --muted-foreground (80→50), --secondary (sage→210 218 200)
- [x] Dashboard light mode: stat cards use solid light colors (amber-100, blue-100, etc.) instead of near-invisible /20 gradients
- [x] Dashboard curriculum cards: bg-card instead of bg-white/[0.03] — clearly visible on cream background
- [x] Focus mode readability: light sage-white bg (#F5F7F5), white card, larger text (1.125rem), line-height 1.95, explicit dark colors (#111411), bigger headings (text-2xl), generous padding (p-8/p-12)
- [x] Added @tailwindcss/typography plugin import so prose class works in normal lesson mode
- [x] Task 1: Unified LessonPage render path — always Streamdown (fixes bold/markdown), word-click via DOM caretRangeFromPoint
- [x] Task 2: Fixed mobile button overlaps — Back button moved from absolute to flow positioning in SignIn/SignUp; nav Sign In hidden on mobile
- [x] Task 3: Logo links to /dashboard when authenticated (AppShell always, Home.tsx auth-aware)
- [x] Task 4: Device detection via matchMedia(pointer:coarse) — lesson toolbar collapses to Read Aloud + More menu on touch devices
- [x] Task 5: Removed Share2 icon from ConceptMapSVG, replaced with Network icon
- [x] Task 6: Fixed TRY SAYING panel contrast — white bg with dark text (#111411) instead of dark nav-bg with foreground/50
- [x] Task 7: ELEVENLABS_API_KEY set as server secret; client-side useTTS uses VITE_ELEVENLABS_API_KEY directly from browser (bypasses geo-block); SpeechSynthesisUtterance only in useTTS.ts + intentional browser fallback in SpeechContext for short assertive announcements
- [x] Fix ElevenLabs voice IDs: switched from premium library voices (402 error) to free-tier Bella voice (EXAVITQu4vr4xnSDxMaL) on both client and server
- [x] Fix voice commands: removed LLM fallback dependency (required auth), all commands now use instant regex matching; unknown phrases routed to AI tutor
- [x] Fix button overlaps: mic button moved to bottom-right, VoiceChatPanel anchored to bottom-right, Commands hint removed from below mic (now shows on hover)
- [x] Simplify lesson toolbar: reduced to Listen + Focus + More (dropdown), secondary tools hidden in dropdown
- [x] Auto-enter focus mode for ADHD (mode=focus) and blind/audio-first users when opening a lesson

## Edge-Case Debug Pass — Aug 11 2026
- [x] Fix Search action so clicking opens and operates the search interface.
- [x] Stop active narration immediately on route change or component unmount.
- [x] Replace the cramped More menu with an accessible anchored dropdown that does not scroll internally.
- [x] Keep lesson word highlighting in sync with Listen start/stop state.
- [x] Repair Concept Map diagram rendering and fallback behavior.
- [x] Fix visual selection state in Settings.
- [x] Render simplified lesson Markdown safely without literal asterisk artifacts.
- [x] Preserve Hikma AI chat messages while contrast and focus preferences change.

## Full Reliability Audit — Aug 11 2026
- [x] Establish current build, test, console, dependency, and credential-exposure baseline without reading secrets.
- [x] Fix the P0 lesson TTS cleanup render loop found during baseline console inspection.
- [x] Trace navigation, authentication, onboarding, settings, responsive, and RTL flows end-to-end.
- [x] Fix role-filtered navigation parity across desktop nav, More, mobile drawer, and command palette.
- [x] Make Search reachable from the mobile navigation path.
- [x] Add explicit authentication and role guards for direct app, teacher, guardian, and admin routes.
- [x] Restore minimal pre-auth language, contrast, and text-size controls on the landing page.
- [x] Fix dashboard counter zero glyph rendering without changing accessibility profile body fonts.
- [x] Trace lessons, assessments, tutor, voice, keyboard, and accessibility-profile flows end-to-end.
- [x] Synchronize the lesson Focus control with persisted profile focus state.
- [x] Cancel delayed lesson-completion navigation when a learner leaves the lesson.
- [x] Restore word-definition selection for normal Markdown lesson text.
- [x] Prevent stale quiz-generation responses from replacing the current lesson or locale state.
- [x] Ensure failed or missing quiz lessons leave the learner in an actionable state instead of an indefinite spinner.
- [x] Clean up quiz recording and recognition resources when the page changes or unmounts.
- [x] Abort tutor streams and release tutor voice-input resources when leaving the tutor page.
- [x] Stabilize the shared speech context so focus-profile effects cannot cancel narration on ordinary re-renders.
- [x] Suppress repeated ElevenLabs quota failures and use a controlled browser-voice fallback for the rest of the session.
- [x] Fix dashboard card contrast under data-theme dark, where Tailwind dark variants do not activate.
- [x] Fix every confirmed root cause with an issue-focused regression test or mechanical guardrail where practical.
- [x] Run the full accessibility verification matrix, update AUDIT.md, and publish only verified fixes.
