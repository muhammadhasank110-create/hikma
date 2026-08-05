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
- [ ] Tap-any-word: definition, pronunciation (future)
- [x] Simplify this button (LLM-powered via tutor)
- [x] Summary-first section structure
- [x] Overlay tints (in settings: blue/yellow/peach/green/grey)

## Phase 6: Lesson Engine — Audio-First Mode
- [x] Full lesson narration (OpenAI TTS + browser fallback)
- [x] Navigable lesson outline (arrow keys ← →)
- [x] Lesson accelerator keys (Space, R, S, F, P, Esc, ← →)
- [ ] Position awareness (Ctrl+P speaks position) (future)
- [x] Automatic diagram description (via tutor describeImage)
- [ ] Data sonification for charts (future)
- [x] Earcons toggle (in settings)
- [ ] Audio ducking (future)

## Phase 7: Lesson Engine — Focus Mode
- [x] One-task-per-screen chunking (section-by-section navigation)
- [x] Micro-lesson structure (sections with title + body)
- [x] Visible arrival rail (progress bar)
- [x] Save-and-resume (progress saved to DB)
- [x] Park-it capture (P key + input field)
- [x] Pomodoro timer (implemented in LessonPage Focus mode — 25/5 min Pomodoro with visual countdown)
- [ ] Body-double AI companion (future)
- [x] Gentle gamification toggle (in settings)
- [ ] Overwhelm escape hatch button (future)

## Phase 8: AI Tutor
- [x] /tutor — full-screen conversational tutor
- [x] Streaming LLM responses (SSE via tRPC)
- [x] Curriculum-aware system prompt
- [x] Voice input (Whisper STT + browser fallback)
- [x] Voice output toggle (OpenAI TTS + browser fallback)
- [x] Push-to-talk microphone button
- [x] Text transcript alongside voice
- [ ] Modality switching mid-lesson (future)
- [x] Concept-map JSON output from tutor
- [x] Re-explain at different level (via tutor)
- [ ] Socratic one-question check (future)
- [x] Arabic responses (locale-aware system prompt)

## Phase 9: Concept Maps
- [x] Concept map generation via AI tutor (JSON output)
- [x] Concept map SVG visualisation (implemented in LessonPage — SVG node/edge graph, keyboard navigable)
- [ ] Keyboard-navigable nodes (future)
- [ ] Text alternative nested list (future)
- [ ] RTL layout in Arabic mode (future)
- [ ] Tactile-graphic SVG export (future)

## Phase 10: Accessible Assessment
- [x] /check/:id — one item per screen, AI-generated questions, MCQ/TF/short-answer, voice, TTS, score
- [ ] Answer by voice, typing, or selection (future)
- [x] No time limits, no speed scoring (by design)
- [x] Command-word coaching (/exam-skills page)
- [x] Plain-language mark schemes (/exam-skills page)
- [x] Access arrangements info (/exam-skills page — MADA + Qatar MoEHE)

## Phase 11: Curriculum System
- [x] IGCSE Edexcel — Math, English, Science seed content
- [x] Qatar MoEHE — Math, English, Science seed content
- [x] Canonical concept graph (concepts table + curriculumMappings)
- [ ] Mastery transfers across curricula (future)
- [x] /exam-skills — command words, time management, mark schemes, access arrangements

## Phase 12: ECC Track
- [x] /ecc — nine areas overview with progress bars
- [ ] /ecc/:area — ECC area lesson (future — uses same lesson engine)
- [x] Area 1: Compensatory Skills (seeded)
- [x] Area 3: Social Interaction Skills (seeded)
- [x] Area 7: Assistive Technology (seeded)
- [x] Area 9: Self-Determination (seeded)
- [ ] ECC progress reporting (IEP-ready export) (future)
- [ ] TVI link and shared log (future)

## Phase 13: Dashboards
- [x] /progress — learner's own progress (mastery stats + lesson history)
- [x] /guardian — guardian dashboard (stub, ready for data)
- [x] /teacher — teacher dashboard (stub, ready for data)
- [x] /admin — admin dashboard (stub)
- [ ] Normal-way-of-working report export (future)
- [x] /settings — all profile switches with live preview

## Phase 14: Polish & QA
- [x] WCAG 2.2 AA: skip links, ARIA labels, focus rings, semantic HTML
- [x] RTL/Arabic layout (direction switching, Amiri font, Arabic numerals toggle)
- [x] prefers-reduced-motion (in settings)
- [x] High contrast mode (toggle in nav bar)
- [x] 320px viewport reflow (verified at 320x568 for landing, dashboard, tutor, settings)
- [ ] 400% browser zoom QA (future — requires manual browser testing)
- [ ] Windows High Contrast Mode (QA needed)
- [x] PWA manifest.json (name, icons, shortcuts, theme-color, manifest link in index.html)
- [ ] PWA offline caching / service worker (future)
- [ ] LCP < 2.5s performance audit (future)
- [x] Vitest: auth.logout test passes
