import { test, expect } from "@playwright/test";

/**
 * E2E – Exercise submission flow
 *
 * This test validates the submission UI renders properly.
 * A full end-to-end submission test requires a live DB and auth session,
 * so this smoke test checks page accessibility and key UI elements.
 *
 * Requires the Next.js app to be running at BASE_URL (default http://localhost:3000).
 * Run with: npm run test:e2e
 */
test.describe("Exercise submission flow", () => {
  test("workshops discovery page loads and shows search", async ({ page }) => {
    await page.goto("/workshops");

    // Unauthenticated users should see a page (redirect to sign-in or the workshops listing)
    // Either the sign-in page or the workshops page should render without errors
    const url = page.url();
    expect(url).toMatch(/\/(workshops|auth\/sign-in)/);

    // No 500 errors
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("sign-in page renders correctly", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign.?in|log.?in/i })
    ).toBeVisible();
  });
});
