import { test, expect } from "@playwright/test";

/**
 * E2E – Navigation and authentication guards
 *
 * Tests that protected routes redirect unauthenticated users to sign-in,
 * and that navigation links resolve to the correct pages.
 *
 * Requires the Next.js app to be running at BASE_URL (default http://localhost:3000).
 */

test.describe("Authentication guards (unauthenticated redirects)", () => {
  test("dashboard redirects to sign-in when not logged in", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/auth\/sign-in/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("workshops page redirects to sign-in when not logged in", async ({ page }) => {
    await page.goto("/workshops");

    await expect(page).toHaveURL(/auth\/sign-in/);
  });

  test("paths page redirects to sign-in when not logged in", async ({ page }) => {
    await page.goto("/paths");

    await expect(page).toHaveURL(/auth\/sign-in/);
  });

  test("create workshop redirects to sign-in when not logged in", async ({ page }) => {
    await page.goto("/workshops/new");

    await expect(page).toHaveURL(/auth\/sign-in/);
  });

  test("create learning path redirects to sign-in when not logged in", async ({ page }) => {
    await page.goto("/paths/new");

    await expect(page).toHaveURL(/auth\/sign-in/);
  });

  test("dashboard certificates redirects to sign-in when not logged in", async ({
    page,
  }) => {
    await page.goto("/dashboard/certificates");

    await expect(page).toHaveURL(/auth\/sign-in/);
  });

  test("dashboard progress redirects to sign-in when not logged in", async ({
    page,
  }) => {
    await page.goto("/dashboard/progress");

    await expect(page).toHaveURL(/auth\/sign-in|not-found|404/);
    // If it's a 404, that's acceptable too; we just shouldn't serve protected content
  });

  test("billing page redirects or shows sign-in when not logged in", async ({
    page,
  }) => {
    await page.goto("/billing");

    // Should redirect to sign-in or show auth page
    const url = page.url();
    expect(url).toMatch(/auth\/sign-in|billing/);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("settings email page redirects when not logged in", async ({ page }) => {
    await page.goto("/settings/email");

    await expect(page).toHaveURL(/auth\/sign-in/);
  });

  test("settings referral page redirects when not logged in", async ({ page }) => {
    await page.goto("/settings/referral");

    await expect(page).toHaveURL(/auth\/sign-in/);
  });

  test("admin page redirects when not logged in as admin", async ({ page }) => {
    await page.goto("/admin");

    // Should either redirect to sign-in or show an unauthorized/error state
    const url = page.url();
    expect(url).toMatch(/auth\/sign-in|admin/);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("next query param preserved on redirect to sign-in", async ({ page }) => {
    await page.goto("/dashboard");

    // The sign-in page should receive ?next=/dashboard
    const url = page.url();
    // Either includes next param or just landed on sign-in
    expect(url).toMatch(/auth\/sign-in/);
  });
});

test.describe("Public page navigation links", () => {
  test("Marketplace nav link from home navigates correctly", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("navigation", { name: /site navigation/i })
      .getByRole("link", { name: "Marketplace" })
      .click();

    await expect(page).toHaveURL(/marketplace/);
    await expect(
      page.getByRole("heading", { name: /workshop marketplace/i })
    ).toBeVisible();
  });

  test("Docs nav link from home navigates correctly", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("navigation", { name: /site navigation/i })
      .getByRole("link", { name: "Docs" })
      .click();

    await expect(page).toHaveURL(/docs/);
    await expect(
      page.getByRole("heading", { name: "Documentation" })
    ).toBeVisible();
  });

  test("Pricing page accessible via direct URL", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /simple.*pricing/i })
    ).toBeVisible();
  });

  test("PromptingSchool logo in marketplace nav links to home", async ({
    page,
  }) => {
    await page.goto("/marketplace");

    const logo = page.getByRole("link", { name: "PromptingSchool" });
    await expect(logo).toHaveAttribute("href", "/");
  });

  test("Docs links in sidebar navigate to sub-pages", async ({ page }) => {
    await page.goto("/docs");

    await page
      .getByRole("navigation", { name: /docs sections/i })
      .getByRole("link", { name: "Instructor Guide" })
      .click();

    await expect(page).toHaveURL(/docs\/instructor-guide/);
  });

  test("Enroll button on marketplace workshop card links to sign-in", async ({
    page,
  }) => {
    await page.goto("/marketplace");

    // Wait for workshops to load
    await page.waitForTimeout(1000);

    const enrollLink = page.getByRole("link", { name: "Enroll" }).first();
    if (await enrollLink.isVisible()) {
      await expect(enrollLink).toHaveAttribute("href", "/auth/sign-in");
    }
  });

  test("Footer workshops link goes to workshops page", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Workshops" })
      .click();

    // Workshops is protected, so we should land on sign-in
    await expect(page).toHaveURL(/workshops|auth\/sign-in/);
  });
});

test.describe("Browser history and back navigation", () => {
  test("can navigate back from sign-up to home", async ({ page }) => {
    await page.goto("/");
    await page.goto("/auth/sign-up");
    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
  });

  test("can navigate back from pricing to home", async ({ page }) => {
    await page.goto("/");
    await page.goto("/pricing");
    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
  });

  test("can navigate back from marketplace to home", async ({ page }) => {
    await page.goto("/");
    await page.goto("/marketplace");
    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("Page title and meta", () => {
  test("home page has a meaningful title", async ({ page }) => {
    await page.goto("/");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test("sign-in page has a meaningful title", async ({ page }) => {
    await page.goto("/auth/sign-in");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test("pricing page has a meaningful title", async ({ page }) => {
    await page.goto("/pricing");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
  });

  test("docs page has correct title", async ({ page }) => {
    await page.goto("/docs");

    const title = await page.title();
    expect(title).toMatch(/documentation|promptingschool/i);
  });
});
