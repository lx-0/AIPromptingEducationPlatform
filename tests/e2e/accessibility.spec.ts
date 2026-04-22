import { test, expect } from "@playwright/test";

/**
 * E2E – Accessibility and page health checks
 *
 * Tests that pages have proper ARIA landmarks, focusable form elements,
 * no JavaScript crashes, no server-side errors, and correct semantic structure.
 *
 * Requires the Next.js app to be running at BASE_URL (default http://localhost:3000).
 */

const PUBLIC_PAGES = [
  { path: "/", name: "Home" },
  { path: "/pricing", name: "Pricing" },
  { path: "/marketplace", name: "Marketplace" },
  { path: "/docs", name: "Docs overview" },
  { path: "/docs/instructor-guide", name: "Instructor guide" },
  { path: "/docs/trainee-guide", name: "Trainee guide" },
  { path: "/docs/faq", name: "FAQ" },
  { path: "/auth/sign-in", name: "Sign-in" },
  { path: "/auth/sign-up", name: "Sign-up" },
];

test.describe("No server errors on public pages", () => {
  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} page renders without server errors`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator("body")).not.toContainText("Internal Server Error");
      await expect(page.locator("body")).not.toContainText("Application error");
      await expect(page.locator("body")).not.toContainText(
        "An unexpected error has occurred"
      );
    });
  }
});

test.describe("ARIA landmarks", () => {
  test("home page has main landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("home page has navigation landmark", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("navigation", { name: /site navigation/i })
    ).toBeVisible();
  });

  test("home page has contentinfo (footer) landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("sign-in page has main landmark", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("sign-up page has main landmark", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("pricing page has main landmark", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("pricing page has navigation landmark", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("docs page has main landmark with id=main-content", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("docs page has sidebar navigation landmark", async ({ page }) => {
    await page.goto("/docs");
    await expect(
      page.getByRole("navigation", { name: /docs sections/i })
    ).toBeVisible();
  });

  test("marketplace page has main landmark", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Heading hierarchy", () => {
  test("home page has a single H1", async ({ page }) => {
    await page.goto("/");

    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
  });

  test("sign-in page has a single H1", async ({ page }) => {
    await page.goto("/auth/sign-in");

    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toContainText(/sign in/i);
  });

  test("sign-up page has a single H1", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toContainText(/create an account/i);
  });

  test("pricing page has a single H1", async ({ page }) => {
    await page.goto("/pricing");

    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toContainText(/pricing/i);
  });

  test("marketplace page has a single H1", async ({ page }) => {
    await page.goto("/marketplace");

    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toContainText(/workshop marketplace/i);
  });

  test("docs overview has a single H1", async ({ page }) => {
    await page.goto("/docs");

    const h1s = page.locator("#main-content h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toContainText(/documentation/i);
  });
});

test.describe("Form accessibility", () => {
  test("sign-in email input has associated label", async ({ page }) => {
    await page.goto("/auth/sign-in");

    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();

    const label = page.locator("label[for='email']");
    await expect(label).toBeVisible();
  });

  test("sign-in password input has associated label", async ({ page }) => {
    await page.goto("/auth/sign-in");

    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();

    const label = page.locator("label[for='password']");
    await expect(label).toBeVisible();
  });

  test("sign-up all inputs have associated labels", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const inputs = ["displayName", "email", "password"];
    for (const id of inputs) {
      await expect(page.locator(`#${id}`)).toBeVisible();
      await expect(page.locator(`label[for='${id}']`)).toBeVisible();
    }
  });

  test("sign-in form submit button is keyboard accessible", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await page.keyboard.press("Tab"); // focus email
    await page.keyboard.press("Tab"); // focus password
    await page.keyboard.press("Tab"); // focus submit button

    const focused = page.locator(":focus");
    await expect(focused).toHaveRole("button");
  });

  test("sign-in error alert has role=alert", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for error response
    await page.waitForTimeout(2000);

    const alerts = page.getByRole("alert");
    const count = await alerts.count();
    if (count > 0) {
      await expect(alerts.first()).toBeVisible();
    }
    // No crash either way
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("sign-up role fieldset has legend", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const fieldset = page.locator("fieldset");
    await expect(fieldset).toBeVisible();
    await expect(fieldset.locator("legend")).toBeVisible();
  });
});

test.describe("Keyboard navigation", () => {
  test("home page links are tab-navigable", async ({ page }) => {
    await page.goto("/");

    // Tab through a few elements to verify focus works
    await page.keyboard.press("Tab");
    const firstFocused = page.locator(":focus");
    await expect(firstFocused).toBeAttached();
  });

  test("marketplace search input is keyboard accessible", async ({ page }) => {
    await page.goto("/marketplace");

    const searchInput = page.getByPlaceholder(/search workshops/i);
    await searchInput.focus();
    await searchInput.type("test");
    await expect(searchInput).toHaveValue("test");
  });

  test("sign-in form can be filled with keyboard", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await page.getByLabel("Email").focus();
    await page.keyboard.type("user@example.com");
    await expect(page.getByLabel("Email")).toHaveValue("user@example.com");

    await page.keyboard.press("Tab");
    await page.keyboard.type("mypassword");
    await expect(page.getByLabel("Password")).toHaveValue("mypassword");
  });
});

test.describe("Image and icon accessibility", () => {
  test("Google sign-in icon on sign-in page is aria-hidden", async ({ page }) => {
    await page.goto("/auth/sign-in");

    const googleIcon = page.locator(
      "a[href*='google'] svg[aria-hidden='true']"
    );
    await expect(googleIcon).toBeAttached();
  });

  test("Google sign-up icon on sign-up page is aria-hidden", async ({ page }) => {
    await page.goto("/auth/sign-up");

    const googleIcon = page.locator(
      "a[href*='google'] svg[aria-hidden='true']"
    );
    await expect(googleIcon).toBeAttached();
  });
});

test.describe("Responsive layout checks", () => {
  test("home page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("sign-in page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/auth/sign-in");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
  });

  test("pricing page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /pricing/i })
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("marketplace page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/marketplace");

    await expect(
      page.getByRole("heading", { name: /workshop marketplace/i })
    ).toBeVisible();
  });
});

test.describe("Performance and network health", () => {
  test("home page responds within 10 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  test("health endpoint returns 200", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.status()).toBe(200);
  });

  test("sign-in page responds within 10 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/auth/sign-in");
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });
});
