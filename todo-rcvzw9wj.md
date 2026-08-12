# Project TODO

- [x] Audit current shared motion utilities, shell behavior, and high-traffic learning screens for existing animation patterns and accessibility profile interactions.
- [x] Add a single typed motion token module with reduced-motion-safe variants that are shared by React UI components.
- [x] Update shared page transitions and staggered reveal components to use the central tokens and profile-aware reduced-motion behavior.
- [x] Enhance shared shell navigation, mobile drawer, and command palette with purposeful, keyboard-safe enter/exit motion and no layout-shift animations.
- [x] Improve the public landing page’s motion system by removing excess decorative effects and applying performance-safe, reduced-motion-aware interaction feedback.
- [x] Apply standardized motion states to priority dashboard and learning interfaces without disrupting learner task completion.
- [x] Add or update focused Vitest coverage for the motion token and reduced-motion utility behavior.
- [x] Verify desktop and mobile behavior for touched screens and record actual evidence in AUDIT.md; Arabic/RTL profile interaction remains a manual follow-up.
- [x] Run type checking and the relevant Vitest suite and review desktop/mobile visual output; save a checkpoint and publish the verified update.
- [x] Add landing-page SEO metadata with 3–8 focused keywords, a 30–60 character document title, one descriptive H1 of 80 characters or fewer, and descriptive alternative text for all meaningful landing-page images.
- [x] Diagnose and fix the reported client render failure originating while the ProfileProvider calls useAuth/state; verify the public landing route recovers without console errors.
- [x] Restore readable dashboard card text and progress values when the active dark or high-contrast profile is applied.
- [x] Verify the dashboard card correction through the high-contrast semantic token mapping and record the exact evidence in AUDIT.md.
- [x] Create the required checkpoint after final verification so the completed UI and SEO update is published.
