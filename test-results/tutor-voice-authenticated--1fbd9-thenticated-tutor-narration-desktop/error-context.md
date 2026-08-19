# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tutor-voice-authenticated.spec.ts >> authenticated tutor narration >> shows the speaking wave and stops authenticated tutor narration
- Location: e2e/tutor-voice-authenticated.spec.ts:31:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('log', { name: /hikma ai conversation/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('log', { name: /hikma ai conversation/i })

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
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | const mockUser = {
  4   |   id: 9001, openId: "playwright-learner", name: "Playwright Learner", email: "learner@example.com",
  5   |   role: "learner", locale: "en", loginMethod: "test", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastSignedIn: new Date().toISOString(),
  6   | };
  7   | 
  8   | const usableSubjects = [
  9   |   { id: 1, curriculumId: 1, code: "MATH-IGCSE", titleEn: "Mathematics", titleAr: "الرياضيات", curriculumFamily: "igcse", curriculumBoard: "Edexcel", curriculumTitleEn: "IGCSE Edexcel", curriculumTitleAr: "IGCSE إيدكسيل", profileKey: "igcse_edexcel" },
  10  |   { id: 2, curriculumId: 1, code: "ENG-IGCSE", titleEn: "English Language", titleAr: "اللغة الإنجليزية", curriculumFamily: "igcse", curriculumBoard: "Edexcel", curriculumTitleEn: "IGCSE Edexcel", curriculumTitleAr: "IGCSE إيدكسيل", profileKey: "igcse_edexcel" },
  11  |   { id: 3, curriculumId: 1, code: "SCI-IGCSE", titleEn: "Science (Double)", titleAr: "العلوم (مزدوج)", curriculumFamily: "igcse", curriculumBoard: "Edexcel", curriculumTitleEn: "IGCSE Edexcel", curriculumTitleAr: "IGCSE إيدكسيل", profileKey: "igcse_edexcel" },
  12  | ];
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
> 33  |     await expect(page.getByRole("log", { name: /hikma ai conversation/i })).toBeVisible();
      |                                                                             ^ Error: expect(locator).toBeVisible() failed
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
  113 |     await expect(mathematics).toHaveAttribute("aria-pressed", "false");
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
```