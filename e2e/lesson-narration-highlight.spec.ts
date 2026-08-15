import { expect, test } from "@playwright/test";

const mockUser = {
  id: 9002, openId: "playwright-lesson-reader", name: "Lesson Reader", email: "reader@example.com",
  role: "learner", locale: "en", loginMethod: "test", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastSignedIn: new Date().toISOString(),
};

const mockLesson = {
  id: 901, topicId: 1, titleEn: "Narration test", titleAr: "اختبار السرد", order: 1, estimatedMinutes: 5, isActive: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), subjectArea: "Science", subjectAreaAr: "العلوم",
  conceptGraph: {
    nodes: [
      { id: "sunlight", label: "Sunlight", labelAr: "ضوء الشمس", type: "input", detail: "Plants capture light energy to begin photosynthesis." },
      { id: "chlorophyll", label: "Chlorophyll", labelAr: "الكلوروفيل", type: "process", detail: "Chlorophyll absorbs light energy inside the leaf." },
      { id: "glucose", label: "Glucose", labelAr: "الجلوكوز", type: "output", detail: "The plant stores the energy it made as glucose." },
    ],
    edges: [
      { from: "sunlight", to: "chlorophyll", label: "absorbed by", labelAr: "يمتصه" },
      { from: "chlorophyll", to: "glucose", label: "helps produce", labelAr: "يساعد على إنتاج" },
    ],
    textAlternative: "Sunlight is absorbed by chlorophyll, helping the plant produce glucose.",
    textAlternativeAr: "يمتص الكلوروفيل ضوء الشمس، مما يساعد النبات على إنتاج الجلوكوز.",
  },
  sections: [{
    id: 1, lessonId: 901, order: 1, titleEn: "Listening words", titleAr: "كلمات الاستماع",
    summaryEn: "A short narration fixture.", summaryAr: "مثبت سرد قصير.",
    bodyEn: "Alpha beta gamma.", bodyAr: "ألفا بيتا جاما.", narrationScriptEn: null, narrationScriptAr: null,
    mediaRefs: [], readingLevel: 2,
  }],
};

test.describe("lesson narration highlighting", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let active: SpeechSynthesisUtterance | null = null;
      (window as any).__lessonSpeechRates = [];
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
        getVoices: () => [], addEventListener: () => {}, removeEventListener: () => {}, resume: () => {},
        speak: (utterance: SpeechSynthesisUtterance) => {
          (window as any).__lessonSpeechRates.push(utterance.rate);
          active = utterance;
          setTimeout(() => utterance.onstart?.(new Event("start") as SpeechSynthesisEvent), 0);
          setTimeout(() => utterance.onboundary?.({ name: "word", charIndex: 0 } as SpeechSynthesisEvent), 90);
          setTimeout(() => utterance.onboundary?.({ name: "word", charIndex: 6 } as SpeechSynthesisEvent), 280);
          setTimeout(() => utterance.onboundary?.({ name: "word", charIndex: 11 } as SpeechSynthesisEvent), 470);
          setTimeout(() => utterance.onend?.(new Event("end") as SpeechSynthesisEvent), 2_500);
        },
        cancel: () => { active?.onend?.(new Event("end") as SpeechSynthesisEvent); active = null; },
      }});
    });
    await page.route(/\/api\/trpc\/auth\.me/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockUser } } }]) }));
    await page.route(/\/api\/trpc\/profile\.(get|update)/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) }));
    await page.route(/\/api\/trpc\/curriculum\.lesson/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockLesson } } }]) }));
    await page.route("**/api/tts/config", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasElevenLabs: false }) }));
  });

  test("starts natural sentence narration on the first Listen request, advances exact native boundaries, and clears on stop", async ({ page }) => {
    await page.goto("/lesson/901");
    await expect(page.getByRole("heading", { name: "Narration test" })).toBeVisible();

    await page.getByRole("button", { name: /read aloud/i }).click();
    const spokenWord = page.locator('mark[data-current-spoken-word="true"]');
    await expect(page.locator("[data-lesson-content]")).toHaveAttribute("data-narration-sync", "browser-boundary");
    await expect(spokenWord).toHaveText("Alpha");
    await expect(spokenWord).toHaveClass(/tts-word-active/);
    await expect(spokenWord).toHaveCount(1);

    await expect(spokenWord).toHaveText("beta", { timeout: 3_000 });
    await expect(spokenWord).toHaveCount(1);

    await expect(spokenWord).toHaveText("gamma.", { timeout: 3_000 });
    await expect(spokenWord).toHaveCount(1);

    await page.getByRole("button", { name: /toggle focus mode/i }).click();
    await expect(spokenWord).toHaveClass(/tts-word-focus/);

    await page.getByRole("button", { name: /stop narration/i }).click();
    await expect(spokenWord).toHaveCount(0);
    await expect(page.locator("[data-lesson-content]")).toHaveAttribute("data-narration-sync", "idle");
  });

  test("is ready on the first Listen request and can start a second natural narration session after stop", async ({ page }) => {
    await page.goto("/lesson/901");
    const listen = page.getByRole("button", { name: /read aloud/i });
    const stop = page.getByRole("button", { name: /stop narration/i });
    const spokenWord = page.locator('mark[data-current-spoken-word="true"]');

    await listen.click();
    await expect(stop).toBeVisible();
    await expect(spokenWord).toHaveText("Alpha");
    await stop.click();
    await expect(spokenWord).toHaveCount(0);

    await listen.click();
    await expect(stop).toBeVisible();
    await expect(spokenWord).toHaveCount(1);
    await expect(spokenWord).toHaveClass(/tts-word-active/);
  });

  test("uses a lesson-only voice speed override without writing global profile preferences", async ({ page }) => {
    let profileWasUpdated = false;
    await page.route(/\/api\/trpc\/profile\.update/, route => {
      profileWasUpdated = true;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) });
    });
    await page.goto("/lesson/901");
    await expect(page.getByRole("group", { name: /lesson voice speed/i })).toBeVisible();
    const speed = page.locator('[role="slider"]').first();
    await expect(speed).toHaveAttribute("aria-valuenow", "1");
    await speed.press("ArrowRight");
    await expect(speed).toHaveAttribute("aria-valuenow", "1.25");
    await page.getByRole("button", { name: /read aloud/i }).click();
    await expect.poll(() => page.evaluate(() => (window as any).__lessonSpeechRates.at(-1))).toBe(1.25);
    expect(profileWasUpdated).toBe(false);
  });

  test("saves final lesson completion before entering the lesson practice flow", async ({ page }) => {
    let savedCompletion = false;
    await page.route(/\/api\/trpc\/progress\.updateProgress/, route => {
      savedCompletion = true;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: { success: true } } } }]) });
    });
    await page.goto("/lesson/901");
    await page.getByRole("button", { name: /practice this lesson/i }).click();
    await page.waitForURL(/\/check\/901/);
    await expect.poll(() => savedCompletion).toBe(true);
  });

  test("opens a keyboard-operable Visual Learning Map with an accessible text alternative", async ({ page }) => {
    await page.goto("/lesson/901");
    await page.getByRole("button", { name: /more options/i }).click();
    await page.getByRole("menuitem", { name: /concept map/i }).click();

    const visualMap = page.getByRole("region", { name: /visual learning map/i });
    await expect(visualMap).toBeVisible();
    await expect(visualMap.getByText("Narration test", { exact: true })).toBeVisible();
    const sunlight = visualMap.getByRole("button", { name: /open sunlight/i });
    await sunlight.focus();
    await sunlight.press("ArrowRight");
    await expect(visualMap.getByRole("button", { name: /open chlorophyll/i })).toHaveAttribute("aria-pressed", "true");
    await expect(visualMap.getByRole("button", { name: /explain this/i })).toBeVisible();
    await expect(visualMap.locator('[id$="-description"]')).toHaveText(/Sunlight is absorbed by chlorophyll/i);
  });

  test("keeps the concept explanation available when optional visual generation fails", async ({ page }) => {
    await page.route(/\/api\/trpc\/tutor\.generateConceptVisual/, route => route.fulfill({
      contentType: "application/json",
      status: 500,
      body: JSON.stringify([{ error: { json: { message: "visual service unavailable", code: -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 } } } }]),
    }));
    await page.goto("/lesson/901");
    await page.getByRole("button", { name: /more options/i }).click();
    await page.getByRole("menuitem", { name: /concept map/i }).click();

    const visualMap = page.getByRole("region", { name: /visual learning map/i });
    await visualMap.getByRole("button", { name: /build visual explanation/i }).click();
    await expect(visualMap.getByText(/The visual is unavailable right now/i)).toBeVisible();
    await expect(visualMap.getByText(/Plants capture light energy to begin photosynthesis/i)).toBeVisible();
    await expect(visualMap.getByRole("button", { name: /try visual again/i })).toBeVisible();
  });

  test("renders meaningful alternative text for a generated educational visual", async ({ page }) => {
    await page.route(/\/api\/trpc\/tutor\.generateConceptVisual/, route => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ result: { data: { json: {
        imageUrl: "https://example.test/photosynthesis.png",
        altText: "High-contrast diagram showing sunlight absorbed by chlorophyll to make glucose.",
        description: "Sunlight enters the leaf, chlorophyll captures its energy, and the plant stores it as glucose.",
        cached: false,
      } } } }]),
    }));
    await page.goto("/lesson/901");
    await page.getByRole("button", { name: /more options/i }).click();
    await page.getByRole("menuitem", { name: /concept map/i }).click();

    const visualMap = page.getByRole("region", { name: /visual learning map/i });
    await visualMap.getByRole("button", { name: /build visual explanation/i }).click();
    await expect(visualMap.getByRole("img", { name: /high-contrast diagram showing sunlight/i })).toBeVisible();
    await expect(visualMap.getByText(/chlorophyll captures its energy/i)).toBeVisible();
  });

  test("localizes the Visual Learning Map controls and direction for Arabic learners", async ({ page }) => {
    await page.goto("/lesson/901?lang=ar");
    await page.getByRole("button", { name: "المزيد من الخيارات" }).click();
    await page.getByRole("menuitem", { name: "خريطة المفاهيم" }).click();

    const visualMap = page.getByRole("region", { name: "خريطة التعلّم البصرية" });
    await expect(visualMap).toHaveAttribute("dir", "rtl");
    await expect(visualMap.getByRole("button", { name: "افتح ضوء الشمس" })).toBeVisible();
    await expect(visualMap.getByRole("button", { name: "اشرح هذا" })).toBeVisible();
  });
});
