import { test, expect } from "@playwright/test";

/**
 * E2E – Sign-up flow
 *
 * Requires the Next.js app to be running at BASE_URL (default http://localhost:3000).
 * Run with: npm run test:e2e
 */
test.describe("Sign-up flow", () => {
  test("sign-up page renders the form", async ({ page }) => {
    await page.goto("/auth/sign-up");

    // Heading (page title is the generic app name; the H1 identifies the page)
    await expect(page.getByRole("heading", { name: /sign.?up|register|create.?account/i })).toBeVisible();

    // Key form fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign.?up|register|create/i })).toBeVisible();
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await page.getByLabel(/email/i).fill("test@example.com");
    // Fill in a short password
    const passwordField = page.getByLabel(/password/i).first();
    await passwordField.fill("short");

    // Try to submit
    await page.getByRole("button", { name: /sign.?up|register|create/i }).click();

    // Should see an error message about password length
    await expect(
      page.getByText(/password|8 characters|at least/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
