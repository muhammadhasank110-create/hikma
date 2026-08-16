import { expect, test } from "@playwright/test";

const mockUser = {
  id: 9001, openId: "playwright-learner", name: "Playwright Learner", email: "learner@example.com",
  role: "learner", locale: "en", loginMethod: "test", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastSignedIn: new Date().toISOString(),
};

test.describe("authenticated tutor narration", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let active: SpeechSynthesisUtterance | null = null;
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
        getVoices: () => [],
        addEventListener: () => {}, removeEventListener: () => {},
        speak: (utterance: SpeechSynthesisUtterance) => { active = utterance; setTimeout(() => utterance.onstart?.(new Event("start") as SpeechSynthesisEvent), 0); },
        cancel: () => { active?.onend?.(new Event("end") as SpeechSynthesisEvent); active = null; },
      }});
    });
    await page.route(/\/api\/trpc\/auth\.me/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockUser } } }]) }));
    await page.route("**/api/tts/config", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasElevenLabs: false }) }));
    await page.route(/\/api\/trpc\/curriculum\.list/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: [] } } }]) }));
  });

  test("shows the speaking wave and stops authenticated tutor narration", async ({ page }) => {
    await page.goto("/tutor");
    await expect(page.getByRole("log", { name: /hikma ai conversation/i })).toBeVisible();
    // Allow the auth query and initial tutor greeting to settle before interacting.
    await page.waitForTimeout(700);
    await page.locator('button[aria-label="Listen"]').first().evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.getByRole("status", { name: "Hikma is speaking" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop narration" })).toBeVisible();
    await page.getByRole("button", { name: "Stop narration" }).click();
    await expect(page.getByRole("status", { name: "Voice is idle" })).toBeVisible();
  });

  test("keeps learner dashboard surface tokens profile-aware for cream, calm, and high contrast", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("#main-content")).toBeVisible();
    for (const [theme, expectedCard] of [["cream", "255 253 248"], ["calm", "248 250 248"], ["high_contrast", "0 0 0"]] as const) {
      await page.evaluate(({ nextTheme }) => { document.documentElement.dataset.theme = nextTheme; }, { nextTheme: theme });
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--card").trim())).toBe(expectedCard);
    }
  });

  test("persists learner subject priorities from accessible Settings controls", async ({ page }) => {
    let persistedInterest = false;
    await page.route(/\/api\/trpc\/profile\.update/, route => {
      persistedInterest = route.request().postData()?.includes("mathematics") ?? false;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) });
    });
    await page.goto("/settings");
    const subjectGroup = page.getByRole("group", { name: "Subjects to prioritise" });
    const mathematics = subjectGroup.getByRole("button", { name: "Mathematics" });
    await expect(mathematics).toHaveAttribute("aria-pressed", "false");
    await mathematics.click();
    await expect(mathematics).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => persistedInterest).toBe(true);
  });

  test("persists an editable learning goal from the Learning preferences settings", async ({ page }) => {
    let persistedGoal = false;
    await page.route(/\/api\/trpc\/profile\.update/, route => {
      persistedGoal = route.request().postData()?.includes("exam") ?? false;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) });
    });
    await page.goto("/settings");
    const goals = page.getByRole("group", { name: "Current learning goals" });
    const examGoal = goals.getByRole("button", { name: "Prepare for exams" });
    await expect(examGoal).toHaveAttribute("aria-pressed", "false");
    await examGoal.click();
    await expect(examGoal).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => persistedGoal).toBe(true);
  });

  test("shows the preference-weighted recommendation reason beside the primary learning action", async ({ page }) => {
    await page.route(/\/api\/trpc\/progress\.learnerSummary/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: {
        stats: { masteredConcepts: 1, inProgressLessons: 0, completedLessons: 0, totalLessons: 3 },
        continueLesson: { lessonId: 71, titleEn: "Algebra foundations", titleAr: "أساسيات الجبر", topicEn: "Algebra", topicAr: "الجبر", subjectEn: "Mathematics", subjectAr: "الرياضيات", status: "not_started", updatedAt: new Date().toISOString() },
        recommendationSource: "priority_subject",
        recentLessons: [],
        weakAreas: [],
      } } } }]),
    }));
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: /continue algebra foundations/i })).toBeVisible();
    await expect(page.getByText("Recommended from the subjects you chose to prioritise.")).toBeVisible();
  });

  test("presents the new learning-goals step in Arabic after the learner selects Arabic", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByRole("radio", { name: /no specific need/i }).click();
    await page.getByRole("button", { name: "Go to next step" }).click();
    await page.getByRole("radio", { name: "Arabic: All content in Arabic" }).click();
    await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
    await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
    await page.getByRole("button", { name: /الانتقال للخطوة التالية/ }).click();
    await expect(page.getByRole("heading", { name: "ما الذي تعمل من أجله الآن؟" })).toBeVisible();
    await expect(page.getByRole("group", { name: "أهداف التعلّم" })).toBeVisible();
  });

  test("renders every command route once without duplicate-key console errors", async ({ page }, testInfo) => {
    const duplicateKeyErrors: string[] = [];
    page.on("console", message => {
      if (message.type() === "error" && /same key|duplicate.*key/i.test(message.text())) {
        duplicateKeyErrors.push(message.text());
      }
    });

    await page.goto("/dashboard");
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "More" }).click();
      await page.getByRole("button", { name: "Search" }).click();
    } else {
      await page.getByRole("button", { name: /open command palette/i }).click();
    }
    const palette = page.getByRole("dialog");
    await expect(palette.getByPlaceholder(/search lessons, topics, or subjects/i)).toBeVisible();
    await expect(palette.getByText("ECC", { exact: true })).toHaveCount(1);
    await expect(palette.getByText("Practice", { exact: true })).toHaveCount(1);
    await expect.poll(() => duplicateKeyErrors).toEqual([]);
  });

  test("discovers matching learning content from the shared command search", async ({ page }, testInfo) => {
    await page.route(/\/api\/trpc\/curriculum\.search/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: [{ id: 17, type: "lesson", titleEn: "Energy transfer", titleAr: "انتقال الطاقة", contextEn: "Physics", contextAr: "الفيزياء", href: "/lesson/17" }] } } }]),
    }));
    await page.goto("/dashboard");
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "More" }).click();
      await page.getByRole("button", { name: "Search" }).click();
    } else {
      await page.getByRole("button", { name: /open command palette/i }).click();
    }
    const palette = page.getByRole("dialog");
    const search = palette.getByPlaceholder(/search lessons, topics, or subjects/i);
    await search.fill("energy");
    await expect(palette.getByText("Energy transfer", { exact: true })).toBeVisible();
    await expect(palette.getByText("Physics", { exact: true })).toBeVisible();
  });

  test("renders the reported ECC area route without duplicate navigation keys", async ({ page }) => {
    const duplicateKeyErrors: string[] = [];
    page.on("console", message => {
      if (message.type() === "error" && /same key|duplicate.*key/i.test(message.text())) {
        duplicateKeyErrors.push(message.text());
      }
    });
    await page.route(/\/api\/trpc\/ecc\.areas/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: [{ id: 1, nameEn: "Independent living", nameAr: "الاستقلالية", descriptionEn: "Daily life skills", descriptionAr: "مهارات الحياة اليومية" }] } } }]),
    }));
    await page.route(/\/api\/trpc\/ecc\.units/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: [{ id: 10, areaId: 1, titleEn: "Plan a journey", titleAr: "خطط لرحلة", descriptionEn: "", descriptionAr: "", lessonId: null, requiresInPersonPractice: false }] } } }]),
    }));
    await page.route(/\/api\/trpc\/ecc\.myProgress/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: [] } } }]),
    }));

    await page.goto("/ecc/1");
    await expect(page.getByRole("heading", { name: "Independent living" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Plan a journey" })).toBeVisible();
    await expect.poll(() => duplicateKeyErrors).toEqual([]);
  });
});
