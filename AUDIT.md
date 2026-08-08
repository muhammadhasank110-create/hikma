# HIKMA Accessibility Audit Log

## Session summary (2026-08-08)

Added user feedback reporting feature to the Settings page. Users can now describe an issue, attach a screenshot (up to 5 MB), and submit — the report is stored in the database and an email notification is sent to the owner via the Manus notification API. The panel is bilingual (EN/AR) and fully keyboard-operable.

| ID | Category | Severity | Profiles/locales affected | Location (file:line) | Symptom | Root cause | Fix | Verified how | Status |
|---|---|---|---|---|---|---|---|---|---|
| F-001 | Feedback / Reporting | Enhancement | All / EN + AR | client/src/components/FeedbackPanel.tsx, server/routers/feedback.ts | No way for users to report bugs or issues | Feature missing | Added FeedbackPanel to Settings page; server stores report in feedback_reports table and notifies owner via notifyOwner() | TypeScript clean, 3/3 tests pass, screenshot verified in Settings page | ✅ Done |
| F-002 | Security | SEV-SECURITY | All | server/routers/feedback.ts | Screenshot upload is gated behind protectedProcedure | N/A — by design | All feedback endpoints require authentication | Code review | ✅ Done |

## Matrix checks for F-001

| Check | Result |
|---|---|
| Keyboard-only | Textarea, Attach button, Send button all reachable via Tab; Enter submits form |
| Semantics | aria-label on all interactive elements; role=button on file input trigger |
| Blind/Low-Vision | All controls have accessible names; success state announced via toast |
| Dyslexia | Uses standard card layout with no unusual spacing |
| ADHD/Focus | Simple 3-step flow: type → attach → send; no distractions |
| Bilingual/RTL | All strings have EN and AR variants; locale prop passed from SettingsPage |
| Voice parity | Not wired to voice commands (low priority for a form) |
| Device parity | Responsive card layout; file input works on mobile |
| No regressions | TypeScript: 0 errors; Tests: 3/3 pass |
