# HIKMA WCAG 2.2 Review — Controlled Development

**Review date:** 2026-08-18  
**Evidence base:** TypeScript validation, 60 unit tests, 80 Playwright browser tests with 2 intentional skips, and the completed controlled Issues 1–9.

## Verified outcomes

| Area | Evidence-backed result |
|---|---|
| Keyboard operability | Interactive curriculum, subject, ECC, and admin cards use native buttons; ECC unit tabs now move selection and focus together with arrow keys. |
| Read-aloud controls | The lesson narration control exposes its pressed state and preserves start, stop, cleanup, and restart behavior. |
| Screen-reader naming and state | Repaired controls expose native roles and selected/expanded state; command, dialog, and status coverage remains in the existing browser suite. |
| Language controls | Arabic-specific numeral and tashkeel preferences appear only in the Arabic interface. |
| Visual contrast | Default `success` and `warning` semantic surfaces now use darker backgrounds with white normal-text labels; existing cream, calm, dark, and high-contrast profile tests pass. |

## Follow-up tickets — not implemented by this review

| ID | Finding | Evidence | Recommended verification |
|---|---|---|---|
| WCAG-F01 | Perform a manual screen-reader pass with current NVDA/VoiceOver on desktop and mobile. | Automated role/name/state checks cannot validate real assistive-technology announcement timing. | Manual task flow through public navigation, Settings, lesson narration, tutor, and ECC tabs. |
| WCAG-F02 | Verify 200–400% zoom and narrow reflow for authenticated learner flows. | Browser projects cover desktop and mobile viewports, not a complete zoom matrix. | Manual browser zoom pass with no horizontal scrolling for core task flows. |
| WCAG-F03 | Verify speech-recognition command handling with real microphones and noisy environments. | Browser coverage uses deterministic recognition mocks and permission/error states. | Assisted device tests with English and Arabic commands. |

## Scope boundary

This review records only observed results and future verification tasks. It does not claim formal accessibility conformance or automatically remediate the follow-up tickets.
