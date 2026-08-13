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
    await expect(page.getByRole("heading", { name: "Playwright" })).toBeVisible();
    for (const [theme, expectedCard] of [["cream", "255 253 248"], ["calm", "248 250 248"], ["high_contrast", "0 0 0"]] as const) {
      await page.evaluate(({ nextTheme }) => { document.documentElement.dataset.theme = nextTheme; }, { nextTheme: theme });
      await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--card").trim())).toBe(expectedCard);
    }
  });
});
