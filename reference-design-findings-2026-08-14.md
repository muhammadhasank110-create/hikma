# Reference Design Findings — 2026-08-14

## Provided Figma Site

The public Figma site presents an education dashboard with a persistent section navigation, a calm daily greeting, a compact streak signal, a visible “Today’s Path” sequence, subject cards that pair progress with the next lesson, and a concise aggregate-progress footer. The most transferable patterns for HIKMA are: actionable daily sequencing rather than a static dashboard; progress and next-step context shown together; restrained subject iconography; and small, repeated feedback signals that make the page feel responsive without relying on decorative effects.

## Provided Figma Board

The direct Figma design board did not expose readable visual content in the available environment. Its title indicates an accessibility-review template. It will therefore inform the implementation through the user’s stated accessibility goals and the visible site patterns above, rather than through copied visual details.

## Implementation Boundaries

The redesign should adapt structural ideas, not copy branding, source content, or design assets. HIKMA must retain its own bilingual Arabic/English behavior, learner accessibility profiles, keyboard support, and reduced-motion fallbacks.

## Attached Recording Findings

The recording shows the active lesson browser-speech path reading one word at a time with long pauses. The current yellow word mark is technically synchronized to that segmented audio but the resulting narration is choppy and too slow to be useful. The observed root cause is per-word utterance sequencing in the lesson-only synchronization implementation. The stop action also pairs the word “Stop” with a muted-speaker icon, which does not match the action. The repair must prioritize natural sentence-level audio; exact word highlighting should use real browser boundary events or provider alignment only, never artificial word-by-word speech segmentation.
