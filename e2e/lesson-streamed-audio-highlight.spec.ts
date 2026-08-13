import { expect, test } from "@playwright/test";

const mockUser = {
  id: 9003, openId: "playwright-audio-reader", name: "Audio Reader", email: "audio@example.com",
  role: "learner", locale: "en", loginMethod: "test", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastSignedIn: new Date().toISOString(),
};

const mockLesson = {
  id: 902, topicId: 1, titleEn: "Streamed narration test", titleAr: "اختبار السرد المتدفق", order: 1, estimatedMinutes: 5, isActive: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), conceptGraph: null,
  sections: [{
    id: 1, lessonId: 902, order: 1, titleEn: "Audio words", titleAr: "كلمات الصوت",
    summaryEn: "A streamed-audio fixture.", summaryAr: "مثبت صوت متدفق.",
    bodyEn: "Alpha beta gamma.", bodyAr: "ألفا بيتا جاما.", narrationScriptEn: null, narrationScriptAr: null,
    mediaRefs: [], readingLevel: 2,
  }],
};

test.describe("streamed lesson narration highlighting", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      class MockAudio {
        currentTime = 0;
        duration = 1;
        paused = true;
        ended = false;
        src = "";
        onplay: ((event: Event) => void) | null = null;
        onended: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        private timer: number | null = null;
        constructor(_src?: string) { this.src = _src ?? ""; }
        play() {
          this.paused = false;
          this.onplay?.(new Event("play"));
          this.timer = window.setInterval(() => { this.currentTime = Math.min(0.98, this.currentTime + 0.08); }, 200);
          return Promise.resolve();
        }
        pause() {
          this.paused = true;
          if (this.timer !== null) window.clearInterval(this.timer);
          this.timer = null;
        }
      }
      Object.defineProperty(window, "Audio", { configurable: true, value: MockAudio });
      URL.createObjectURL = () => "blob:playwright-audio";
      URL.revokeObjectURL = () => {};
    });
    await page.route(/\/api\/trpc\/auth\.me/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockUser } } }]) }));
    await page.route(/\/api\/trpc\/profile\.(get|update)/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: {} } } }]) }));
    await page.route(/\/api\/trpc\/curriculum\.lesson/, route => route.fulfill({ contentType: "application/json", body: JSON.stringify([{ result: { data: { json: mockLesson } } }]) }));
    await page.route("**/api/tts/config", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ hasElevenLabs: true }) }));
    await page.route("**/api/tts/speak-with-timestamps", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({
      audioBase64: "AAECAw==",
      alignment: { characters: Array.from("Alpha beta gamma."), character_start_times_seconds: Array.from("Alpha beta gamma.", (_, index) => index * 0.06) },
    }) }));
  });

  test("advances the exact marked word through streamed audio and clears it on stop", async ({ page }) => {
    await page.goto("/lesson/902");
    await expect(page.getByRole("heading", { name: "Streamed narration test" })).toBeVisible();
    await page.waitForTimeout(150);
    await page.getByRole("button", { name: /read aloud/i }).click();

    const spokenWord = page.locator('mark[data-current-spoken-word="true"]');
    await expect(page.locator("[data-lesson-content]")).toHaveAttribute("data-narration-sync", "timestamped-audio");
    await expect(spokenWord).toHaveText("Alpha");
    await expect(spokenWord).toHaveText("beta", { timeout: 3_000 });
    await expect(spokenWord).toHaveText("gamma.", { timeout: 3_000 });
    await expect(spokenWord).toHaveCount(1);

    await page.getByRole("button", { name: /stop narration/i }).click();
    await expect(spokenWord).toHaveCount(0);
    await expect(page.locator("[data-lesson-content]")).toHaveAttribute("data-narration-sync", "idle");
  });
});
