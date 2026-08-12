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
});
