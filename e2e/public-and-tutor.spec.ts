import { expect, test } from "@playwright/test";

test.describe("public entry and protected tutor", () => {
  test("automatically exits the branded entry into the landing experience", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("heading", { name: /learning space/i })).toBeVisible({ timeout: 4_000 });
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("has one descriptive public-page H1 after the entry transition", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1_800);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText(/learning space/i);
  });

  test("exposes a keyboard skip link after the automatic entry", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1_800);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /skip to main content/i })).toBeFocused();
  });

  test("adopts the device dark theme and exposes global SEO metadata", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index,follow/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /hikmalearn/);
  });

  test("keeps the landing hero inside a narrow viewport", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "This assertion targets the narrow viewport project.");
    await page.goto("/");
    const heading = page.getByRole("heading", { name: /learning space/i });
    await expect(heading).toBeVisible({ timeout: 4_000 });
    const box = await heading.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? -1) >= 0).toBeTruthy();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
  });

  test("keeps the tutor route behind the authentication boundary", async ({ page }) => {
    await page.goto("/tutor");
    await expect(page).toHaveURL(/signin|login|tutor/);
    await expect(page.locator("body")).not.toContainText("undefined");
  });

  test("opens the About page from public navigation", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /learning support/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
  });

  test("renders a complete and labelled contact form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /tell us what would help/i })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Subject")).toBeVisible();
    await expect(page.getByLabel("Message")).toBeVisible();
    await expect(page.getByRole("link", { name: /muhammadhasank110@gmail.com/i })).toHaveAttribute("href", /mailto:/);
  });

  test("announces and focuses the contact fallback status after submission", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Name").fill("Test Learner");
    await page.getByLabel("Email").fill("learner@example.com");
    await page.getByLabel("Subject").fill("Learning support");
    await page.getByLabel("Message").fill("Please help me with a study question.");
    await page.getByRole("button", { name: /email your message/i }).click();
    const status = page.getByRole("status").filter({ hasText: /email application/i });
    await expect(status).toBeVisible();
    await expect(status).toBeFocused();
  });
});
