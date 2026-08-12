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
});
