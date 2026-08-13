import { expect, test } from "@playwright/test";

const mockUser = {
  id: 9002, openId: "playwright-lesson-reader", name: "Lesson Reader", email: "reader@example.com",
  role: "learner", locale: "en", loginMethod: "test", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastSignedIn: new Date().toISOString(),
};

const mockLesson = {
  id: 901, topicId: 1, titleEn: "Narration test", titleAr: "اختبار السرد", order: 1, estimatedMinutes: 5, isActive: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), conceptGraph: null,
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
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
        getVoices: () => [], addEventListener: () => {}, removeEventListener: () => {},
        speak: (utterance: SpeechSynthesisUtterance) => {
          active = utterance;
          setTimeout(() => utterance.onstart?.(new Event("start") as SpeechSynthesisEvent), 0);
          setTimeout(() => utterance.onend?.(new Event("end") as SpeechSynthesisEvent), 900);
        },
        cancel: () => { active?.onend?.(new Event("end") as SpeechSynthesisEvent); active = null; },
      }});
    });
    await page.route(/\/api\/trpc\/auth\.me/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockUser } } }]) }));
    await page.route(/\/api\/trpc\/profile\.(get|update)/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) }));
    await page.route(/\/api\/trpc\/curriculum\.lesson/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockLesson } } }]) }));
    await page.route("**/api/tts/config", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasElevenLabs: false }) }));
  });

  test("highlights only the current narrated word in standard and Focus modes, then clears it on stop", async ({ page }) => {
    await page.goto("/lesson/901");
    await expect(page.getByRole("heading", { name: "Narration test" })).toBeVisible();

    await page.getByRole("button", { name: /read aloud/i }).click();
    const spokenWord = page.locator('mark[data-current-spoken-word="true"]');
    await expect(page.locator("[data-lesson-content]")).toHaveAttribute("data-narration-sync", "browser-segmented");
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
});
