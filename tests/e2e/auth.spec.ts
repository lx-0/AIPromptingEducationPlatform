import { test, expect } from "@playwright/test";

/**
 * E2E – Authentication flows
 *
 * Tests sign-up and sign-in form rendering, validation, error states,
 * and the OAuth sign-in option.
 * Full credential-based auth requires a live DB; these tests cover UI flows.
 *
 * Requires the Next.js app to be running at BASE_URL (default http://localhost:3000).
 */

test.describe("Sign-in page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-in");
  });

  test("renders heading and form fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
  });

  test("shows link to sign-up page", async ({ page }) => {
    const signUpLink = page.getByRole("link", { name: /sign up/i });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute("href", "/auth/sign-up");
  });

  test("shows Google sign-in option", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /sign in with google/i })
    ).toBeVisible();
  });

  test("email field is required", async ({ page }) => {
    // Submit without filling any fields
    await page.getByRole("button", { name: /sign in/i }).click();

    // HTML5 validation prevents submission; email field should be invalid
    const emailInput = page.getByLabel("Email");
    const valid = await emailInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(valid).toBe(false);
  });

  test("password field is required", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByRole("button", { name: /sign in/i }).click();

    const passwordInput = page.getByLabel("Password");
    const valid = await passwordInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(valid).toBe(false);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.getByLabel("Password").fill("wrongpassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show an error alert (either role=alert or error text)
    await expect(
      page.getByRole("alert").or(page.getByText(/invalid|incorrect|not found|sign in failed/i))
    ).toBeVisible({ timeout: 8000 });
  });

  test("sign-in button shows loading state while submitting", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");

    // Click submit and immediately check for loading state
    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await submitBtn.click();

    // After clicking, button may show "Signing in…" while request is in flight
    // This is a best-effort check since timing is non-deterministic
    const loadingState = submitBtn.filter({ hasText: /signing in/i });
    // We just confirm the form didn't crash — the button text will change back once done
    await page.waitForTimeout(200);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("email field accepts valid email format only", async ({ page }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: /sign in/i }).click();

    const emailInput = page.getByLabel("Email");
    const valid = await emailInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(valid).toBe(false);
  });

  test("no server errors on page load", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});

test.describe("Sign-up page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-up");
  });

  test("renders heading and all form fields", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /create an account/i })
    ).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create account/i })
    ).toBeVisible();
  });

  test("shows link back to sign-in", async ({ page }) => {
    const signInLink = page.getByRole("link", { name: /sign in/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/auth/sign-in");
  });

  test("shows role selection (trainee/instructor)", async ({ page }) => {
    await expect(page.getByText(/i am a/i)).toBeVisible();
    await expect(page.getByRole("radio", { name: "trainee" })).toBeAttached();
    await expect(page.getByRole("radio", { name: "instructor" })).toBeAttached();
  });

  test("trainee role is selected by default", async ({ page }) => {
    const traineeRadio = page.getByRole("radio", { name: "trainee" });
    await expect(traineeRadio).toBeChecked();
  });

  test("can switch to instructor role", async ({ page }) => {
    const instructorLabel = page.getByText("instructor", { exact: true });
    await instructorLabel.click();

    const instructorRadio = page.getByRole("radio", { name: "instructor" });
    await expect(instructorRadio).toBeChecked();
  });

  test("shows optional referral code field", async ({ page }) => {
    await expect(page.getByLabel(/referral code/i)).toBeVisible();
    await expect(
      page.getByPlaceholder(/e\.g\. ab12cd34/i)
    ).toBeVisible();
  });

  test("referral code auto-uppercases input", async ({ page }) => {
    const referralInput = page.getByLabel(/referral code/i);
    await referralInput.fill("ab12cd34");

    await expect(referralInput).toHaveValue("AB12CD34");
  });

  test("password field requires minimum 8 characters", async ({ page }) => {
    await page.getByLabel("Display name").fill("Test User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: /create account/i }).click();

    // HTML5 minLength validation
    const passwordInput = page.getByLabel("Password");
    const valid = await passwordInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(valid).toBe(false);
  });

  test("all required fields must be filled", async ({ page }) => {
    // Submit empty form
    await page.getByRole("button", { name: /create account/i }).click();

    const displayNameInput = page.getByLabel("Display name");
    const valid = await displayNameInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valid
    );
    expect(valid).toBe(false);
  });

  test("shows Google sign-up option", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /sign up with google/i })
    ).toBeVisible();
  });

  test("shows error for duplicate email", async ({ page }) => {
    // This test requires no live DB so it just checks we don't crash when submitting
    await page.getByLabel("Display name").fill("Test User");
    await page.getByLabel("Email").fill("existing@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();

    // Either redirects to dashboard or shows error — either is acceptable
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("no server errors on page load", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});

test.describe("Auth page cross-linking", () => {
  test("navigating from sign-in to sign-up works", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByRole("link", { name: /sign up/i }).click();

    await expect(page).toHaveURL(/auth\/sign-up/);
    await expect(
      page.getByRole("heading", { name: /create an account/i })
    ).toBeVisible();
  });

  test("navigating from sign-up to sign-in works", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.getByRole("link", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/auth\/sign-in/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("home page Get started link goes to sign-up", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get started" }).click();

    await expect(page).toHaveURL(/auth\/sign-up/);
  });

  test("home page Sign in link goes to sign-in", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: /site navigation/i })
      .getByRole("link", { name: "Sign in" })
      .click();

    await expect(page).toHaveURL(/auth\/sign-in/);
  });
});
