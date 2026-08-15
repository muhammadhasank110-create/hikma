# HIKMA MVP Gap Assessment

## Current baseline

HIKMA already has a strong foundation for an accessible educational platform. The application includes user roles, learner profiles, structured curriculum tables, lesson sections, accessibility settings, narration, a tutor, ECC content, and basic persistence for lesson progress, attempts, and mastery. The existing subject → topic → lesson path is therefore a sound base rather than a blank scaffold.

The product is not yet a complete learner MVP because the core pathway does not consistently connect **learning content, practice evidence, progress interpretation, and the next recommended action**. The primary implementation work should close that loop rather than add unrelated dashboards or gamification.

| MVP area | Existing capability | Confirmed gap | Priority |
|---|---|---|---|
| Account and onboarding | OAuth, sign-in/up screens, extensive accessibility profile persistence | Password reset is a placeholder; onboarding does not persist subject interests or a specific learning-method preference | P1 |
| Learning structure | Subject, topic, lesson, section, media, and concept tables; topic browser | No consistent lesson completion-to-practice-to-results handoff | P0 |
| Lesson pedagogy | Reading sections, narration, focus mode, inline tutor, concept map | Learning objective, key-points summary, and actionable next step are inconsistent across lessons | P1 |
| Practice | AI-generated MCQ/true-false/short-answer flow | Questions are ephemeral; no durable multi-level hints, retry analytics, or assessment content source | P0 |
| Progress | Lesson progress, attempts, mastery tables and basic progress UI | Dashboard stats are static; no weak-area, recent activity, or recommendation computation | P0 |
| Personalization | Profile mode, curriculum, tier, accessibility preferences, tutor context | Difficulty and recommended practice are not derived from real attempts | P1 |
| Tutor | Socratic tutor, quick utilities, session history, performance counts | Needs shared lesson/practice context and learner-facing quick teaching actions in the core flow | P1 |
| Search and navigation | Command search and subject/topic browsing | Search does not return structured subjects, topics, lessons, or concepts as result types | P2 |
| Feedback states | Some loading/error states exist | Core practice, recommendation, and offline/empty states are not systematic | P1 |

## Minimum durable learning model

The MVP should preserve the existing tables and extend them rather than introduce a parallel content model.

```text
Subject → Topic → Lesson → Section
                         ↓
                    Check item → Attempt → Feedback / Hint level
                         ↓
               Concept mastery → Recommendation → Continue learning
```

The `check_items` table should become the durable practice source. Its existing question, option, mark scheme, concept, and lesson references support the core model. A focused migration should add bilingual progressive hints and an optional answer-normalization rule. The `attempts` table remains the evidence source. A new progress query should join attempts, lesson progress, concepts, topics, and subjects to calculate recent activity, topic mastery, weak areas, and the next lesson or practice recommendation.

## Ordered delivery slice

1. **Structured practice and feedback:** add persistent bilingual hints, answer normalization, attempt saving, retry behavior, and explanation-first feedback.
2. **Learning continuity:** add a learner-summary/recommendations contract and use it for Dashboard, Progress, and lesson completion actions.
3. **Onboarding and preferences:** add learner interests and learning methods to the stored profile and introduce a real password-reset route only if the current authentication backend supports it safely.
4. **Lesson-to-practice experience:** make objectives, key points, optional audio transcript, practice CTA, completion state, and next action explicit in the lesson interface.
5. **Tutor, search, and experience states:** bind quick tutor actions to current lesson/practice context; search structured learning entities; add honest empty, unavailable, and recovery states.

## Acceptance criteria

The MVP is complete when a learner can select a curriculum and subjects, open a structured lesson, understand the learning objective, consume accessible teaching content, attempt persisted questions with progressive hints and feedback, see a mastery-informed next action, resume where they left off, and adjust all core preferences without disclosing a disability.
