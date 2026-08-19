# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tutor-voice-authenticated.spec.ts >> authenticated tutor narration >> persists learner subject priorities from accessible Settings controls
- Location: e2e/tutor-voice-authenticated.spec.ts:104:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('group', { name: 'Subjects to prioritise' }).getByRole('button', { name: 'Mathematics' })
Expected: "false"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for getByRole('group', { name: 'Subjects to prioritise' }).getByRole('button', { name: 'Mathematics' })

```

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- link "Skip to AI tutor":
  - /url: /tutor
- link "Skip to learning settings":
  - /url: /settings
- region "Notifications alt+T"
- status: Loading your account…
- alert
```

# Test source

```ts
  13  | 
  14  | test.describe("authenticated tutor narration", () => {
  15  |   test.beforeEach(async ({ page }) => {
  16  |     await page.addInitScript(() => {
  17  |       let active: SpeechSynthesisUtterance | null = null;
  18  |       Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
  19  |         getVoices: () => [],
  20  |         addEventListener: () => {}, removeEventListener: () => {},
  21  |         speak: (utterance: SpeechSynthesisUtterance) => { active = utterance; setTimeout(() => utterance.onstart?.(new Event("start") as SpeechSynthesisEvent), 0); },
  22  |         cancel: () => { active?.onend?.(new Event("end") as SpeechSynthesisEvent); active = null; },
  23  |       }});
  24  |     });
  25  |     await page.route(/\/api\/trpc\/auth\.me/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockUser } } }]) }));
  26  |     await page.route("**/api/tts/config", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasElevenLabs: false }) }));
  27  |     await page.route(/\/api\/trpc\/curriculum\.list/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) }));
  28  |     await page.route(/\/api\/trpc\/curriculum\.availableSubjects/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: usableSubjects } } }]) }));
  29  |   });
  30  | 
  31  |   test("shows the speaking wave and stops authenticated tutor narration", async ({ page }) => {
  32  |     await page.goto("/tutor");
  33  |     await expect(page.getByRole("log", { name: /hikma ai conversation/i })).toBeVisible();
  34  |     // Allow the auth query and initial tutor greeting to settle before interacting.
  35  |     await page.waitForTimeout(700);
  36  |     await page.locator('button[aria-label="Listen"]').first().evaluate((button: HTMLButtonElement) => button.click());
  37  |     await expect(page.getByRole("status", { name: "Hikma is speaking" })).toBeVisible();
  38  |     await expect(page.getByRole("button", { name: "Stop narration" })).toBeVisible();
  39  |     await page.getByRole("button", { name: "Stop narration" }).click();
  40  |     await expect(page.getByRole("status", { name: "Voice is idle" })).toBeVisible();
  41  |   });
  42  | 
  43  |   test("keeps learner dashboard surface tokens profile-aware for cream, calm, and high contrast", async ({ page }) => {
  44  |     await page.goto("/dashboard");
  45  |     await expect(page.locator("#main-content")).toBeVisible();
  46  |     for (const [theme, expectedCard] of [["cream", "255 253 248"], ["calm", "248 250 248"], ["high_contrast", "0 0 0"]] as const) {
  47  |       await page.evaluate(({ nextTheme }) => { document.documentElement.dataset.theme = nextTheme; }, { nextTheme: theme });
  48  |       await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--card").trim())).toBe(expectedCard);
  49  |     }
  50  |   });
  51  | 
  52  |   test("operates the repaired curriculum, subject, ECC, and admin cards as named native buttons", async ({ page }) => {
  53  |     await page.route(/\/api\/trpc\/curriculum\.list/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [{ id: 1, titleEn: "IGCSE Edexcel", titleAr: "إدكسل IGCSE", board: "Edexcel" }] } } }]) }));
  54  |     await page.route(/\/api\/trpc\/curriculum\.subjects/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [{ id: 1, titleEn: "Mathematics", titleAr: "الرياضيات", code: "MATH-IGCSE" }] } } }]) }));
  55  |     await page.route(/\/api\/trpc\/curriculum\.topics/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) }));
  56  |     await page.goto("/curriculum");
  57  | 
  58  |     const curriculum = page.getByRole("button", { name: /igcse edexcel/i });
  59  |     await expect(curriculum).toHaveAttribute("aria-pressed", "false");
  60  |     await curriculum.focus();
  61  |     await page.keyboard.press("Space");
  62  |     await expect(curriculum).toHaveAttribute("aria-pressed", "true");
  63  | 
  64  |     const mathematicsDisclosure = page.getByRole("button", { name: /mathematics/i });
  65  |     await expect(mathematicsDisclosure).toHaveAttribute("aria-expanded", "false");
  66  |     await mathematicsDisclosure.focus();
  67  |     await page.keyboard.press("Enter");
  68  |     await expect(mathematicsDisclosure).toHaveAttribute("aria-expanded", "true");
  69  |     await expect(page.locator("#subject-topics-1")).toBeVisible();
  70  | 
  71  |     await page.goto("/subjects/1");
  72  |     const mathematicsSubject = page.getByRole("button", { name: "Mathematics" });
  73  |     await mathematicsSubject.focus();
  74  |     await page.keyboard.press("Enter");
  75  |     await expect(page).toHaveURL(/\/subjects\/1\/topics\/1/);
  76  | 
  77  |     await page.route(/\/api\/trpc\/ecc\.areas/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [{ id: 1, number: 1, nameEn: "Sensory Awareness", nameAr: "الوعي الحسي", descriptionEn: "Learn sensory skills", descriptionAr: "تعلم المهارات الحسية" }] } } }]) }));
  78  |     await page.route(/\/api\/trpc\/ecc\.myProgress/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) }));
  79  |     await page.goto("/ecc");
  80  |     const eccArea = page.getByRole("button", { name: "Sensory Awareness", exact: true });
  81  |     await eccArea.focus();
  82  |     await page.keyboard.press("Space");
  83  |     await expect(page).toHaveURL(/\/ecc\/1/);
  84  | 
  85  |     await page.route(/\/api\/trpc\/auth\.me/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { ...mockUser, role: "admin" } } } }]) }));
  86  |     await page.goto("/admin");
  87  |     const users = page.getByRole("button", { name: "Users" });
  88  |     await users.focus();
  89  |     await page.keyboard.press("Space");
  90  |     await expect(page.getByText("User management coming soon")).toBeVisible();
  91  |   });
  92  | 
  93  |   test("uses the shared contrast-safe compact HIKMA brand in the authenticated app header", async ({ page }) => {
  94  |     await page.goto("/dashboard");
  95  |     const brand = page.getByRole("link", { name: "Hikma home" });
  96  |     await expect(brand).toBeVisible();
  97  |     const logo = brand.locator('[data-hikma-logo="compact"] img');
  98  |     await expect(logo).toHaveAttribute("src", /hikma-logo-official-cream-transparent_c99c136d\.png/);
  99  |     const box = await logo.boundingBox();
  100 |     expect(box?.height).toBeGreaterThanOrEqual(48);
  101 |     expect((box?.height ?? 0) / (box?.width ?? 1)).toBeCloseTo(1, 1);
  102 |   });
  103 | 
  104 |   test("persists learner subject priorities from accessible Settings controls", async ({ page }) => {
  105 |     let persistedInterest = false;
  106 |     await page.route(/\/api\/trpc\/profile\.update/, route => {
  107 |       persistedInterest = route.request().postData()?.includes("MATH-IGCSE") ?? false;
  108 |       return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) });
  109 |     });
  110 |     await page.goto("/settings");
  111 |     const subjectGroup = page.getByRole("group", { name: "Subjects to prioritise" });
  112 |     const mathematics = subjectGroup.getByRole("button", { name: "Mathematics" });
> 113 |     await expect(mathematics).toHaveAttribute("aria-pressed", "false");
      |                               ^ Error: expect(locator).toHaveAttribute(expected) failed
  114 |     await mathematics.click();
  115 |     await expect(mathematics).toHaveAttribute("aria-pressed", "true");
  116 |     await expect.poll(() => persistedInterest).toBe(true);
  117 |   });
  118 | 
  119 |   test("shows tashkeel and numeral preferences only in the Arabic interface", async ({ page }) => {
  120 |     await page.goto("/settings");
  121 |     await expect(page.getByRole("switch", { name: "Arabic numerals" })).toHaveCount(0);
  122 |     await expect(page.getByRole("switch", { name: "Tashkeel" })).toHaveCount(0);
  123 | 
  124 |     await page.goto("/settings?lang=ar");
  125 |     await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  126 |     await expect(page.getByRole("switch", { name: "الأرقام العربية" })).toBeVisible();
  127 |     await expect(page.getByRole("switch", { name: "التشكيل" })).toBeVisible();
  128 |   });
  129 | 
  130 |   test("persists an editable learning goal from the Learning preferences settings", async ({ page }) => {
  131 |     let persistedGoal = false;
  132 |     await page.route(/\/api\/trpc\/profile\.update/, route => {
  133 |       persistedGoal = route.request().postData()?.includes("exam") ?? false;
  134 |       return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) });
  135 |     });
  136 |     await page.goto("/settings");
  137 |     const goals = page.getByRole("group", { name: "Current learning goals" });
  138 |     const examGoal = goals.getByRole("button", { name: "Prepare for exams" });
  139 |     await expect(examGoal).toHaveAttribute("aria-pressed", "false");
  140 |     await examGoal.click();
  141 |     await expect(examGoal).toHaveAttribute("aria-pressed", "true");
  142 |     await expect.poll(() => persistedGoal).toBe(true);
  143 |   });
  144 | 
  145 |   test("shows the preference-weighted recommendation reason beside the primary learning action", async ({ page }) => {
  146 |     await page.route(/\/api\/trpc\/progress\.learnerSummary/, route => route.fulfill({
  147 |       contentType: "application/json",
  148 |       body: JSON.stringify([{ result: { data: { json: {
  149 |         stats: { masteredConcepts: 1, inProgressLessons: 0, completedLessons: 0, totalLessons: 3 },
  150 |         continueLesson: { lessonId: 71, titleEn: "Algebra foundations", titleAr: "أساسيات الجبر", topicEn: "Algebra", topicAr: "الجبر", subjectEn: "Mathematics", subjectAr: "الرياضيات", status: "not_started", updatedAt: new Date().toISOString() },
  151 |         recommendationSource: "priority_subject",
  152 |         recentLessons: [],
  153 |         weakAreas: [],
  154 |       } } } }]),
  155 |     }));
  156 |     await page.goto("/dashboard");
  157 |     await expect(page.getByRole("button", { name: /continue algebra foundations/i })).toBeVisible();
  158 |     await expect(page.getByText("Recommended from the subjects you chose to prioritise.")).toBeVisible();
  159 |   });
  160 | 
  161 |   test("presents the new learning-goals step in Arabic after the learner selects Arabic", async ({ page }) => {
  162 |     await page.goto("/onboarding");
  163 |     await page.getByRole("radio", { name: /no specific need/i }).click();
  164 |     await page.getByRole("button", { name: "Go to next step" }).click();
  165 |     await page.getByRole("radio", { name: "Arabic: All content in Arabic" }).click();
  166 |     await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
  167 |     await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
  168 |     await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
  169 |     await expect(page.getByRole("heading", { name: "ما الذي تعمل من أجله الآن؟" })).toBeVisible();
  170 |     await expect(page.getByRole("group", { name: "أهداف التعلّم" })).toBeVisible();
  171 |   });
  172 | 
  173 |   test("shows only live usable subjects in Arabic onboarding and never invents Arabic as a subject", async ({ page }) => {
  174 |     await page.goto("/onboarding");
  175 |     await page.getByRole("radio", { name: /no specific need/i }).click();
  176 |     await page.getByRole("button", { name: "Go to next step" }).click();
  177 |     await page.getByRole("radio", { name: "Arabic: All content in Arabic" }).click();
  178 |     await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
  179 |     const subjects = page.getByRole("group", { name: "اهتمامات المواد" });
  180 |     await expect(subjects.getByRole("button", { name: "الرياضيات" })).toBeVisible();
  181 |     await expect(subjects.getByRole("button", { name: "اللغة الإنجليزية" })).toBeVisible();
  182 |     await expect(subjects.getByRole("button", { name: "العلوم (مزدوج)" })).toBeVisible();
  183 |     await expect(subjects.getByRole("button", { name: /^العربية$/ })).toHaveCount(0);
  184 |   });
  185 | 
  186 |   test("executes a recognized live subject voice command and confirms the action visibly", async ({ page }) => {
  187 |     await page.addInitScript(() => {
  188 |       class VoiceRecognition {
  189 |         lang = ""; continuous = false; interimResults = false; maxAlternatives = 1;
  190 |         onstart?: () => void; onresult?: (event: any) => void; onerror?: () => void; onend?: () => void;
  191 |         start() { (window as any).__hikmaRecognition = this; this.onstart?.(); }
  192 |         stop() { this.onend?.(); }
  193 |         abort() {}
  194 |         emit(transcript: string) { this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript } }] }); }
  195 |       }
  196 |       Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: VoiceRecognition });
  197 |       Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => {} }] }) } });
  198 |     });
  199 |     await page.route("**/api/trpc/**", async route => {
  200 |       const procedureNames = new URL(route.request().url()).pathname.split("/").at(-1)?.split(",") ?? [];
  201 |       if (!procedureNames.includes("curriculum.availableSubjects")) return route.fallback();
  202 |       const body = procedureNames.map(name => ({ result: { data: { json:
  203 |         name === "auth.me" ? mockUser
  204 |           : name === "curriculum.availableSubjects" ? usableSubjects
  205 |             : name === "progress.learnerSummary" ? { stats: { masteredConcepts: 0, inProgressLessons: 0, completedLessons: 0, totalLessons: 0 }, continueLesson: null, recentLessons: [], weakAreas: [] }
  206 |               : name === "curriculum.list" ? []
  207 |                 : null,
  208 |       } } }));
  209 |       await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  210 |     });
  211 |     const availableSubjectsResponse = page.waitForResponse(response => response.url().includes("curriculum.availableSubjects"));
  212 |     await page.goto("/dashboard");
  213 |     await availableSubjectsResponse;
```