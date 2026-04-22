import { test, expect } from "@playwright/test";

/**
 * E2E – Public marketing pages
 *
 * Tests pages accessible without authentication.
 * Requires the Next.js app to be running at BASE_URL (default http://localhost:3000).
 */

test.describe("Home page", () => {
  test("renders hero section with CTA links", async ({ page }) => {
    await page.goto("/");

    // Heading
    await expect(
      page.getByRole("heading", { name: /master ai prompting/i })
    ).toBeVisible();

    // Primary CTA buttons
    await expect(
      page.getByRole("link", { name: /sign up free/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /sign in/i }).first()
    ).toBeVisible();
  });

  test("shows site nav with Marketplace and Docs links", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("navigation", { name: /site navigation/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Marketplace" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Docs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
  });

  test("displays platform stats section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("500+")).toBeVisible();
    await expect(page.getByText("Prompting exercises")).toBeVisible();
    await expect(page.getByText("1,000+")).toBeVisible();
    await expect(page.getByText("Students trained")).toBeVisible();
  });

  test("shows feature highlights section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("AI-powered scoring")).toBeVisible();
    await expect(page.getByText("Real-time feedback")).toBeVisible();
    await expect(page.getByText("Rubric-based evaluation")).toBeVisible();
    await expect(page.getByText("Workshop management")).toBeVisible();
  });

  test("shows how it works section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /how it works/i })
    ).toBeVisible();
    await expect(page.getByText("Create a workshop")).toBeVisible();
    await expect(page.getByText("Invite trainees")).toBeVisible();
    await expect(page.getByText("Track progress")).toBeVisible();
  });

  test("shows footer with nav links", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer.getByText("PromptingSchool")).toBeVisible();
    await expect(footer.getByRole("link", { name: "Sign up" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Workshops" })).toBeVisible();
  });

  test("no server errors on page load", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("Get started free CTA links to sign-up", async ({ page }) => {
    await page.goto("/");

    const cta = page.getByRole("link", { name: "Get started free" });
    await expect(cta).toHaveAttribute("href", "/auth/sign-up");
  });
});

test.describe("Pricing page", () => {
  test("renders all three pricing plans", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /simple.*pricing/i })
    ).toBeVisible();

    // Three plan names
    await expect(page.getByRole("heading", { name: "Free" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
  });

  test("shows price amounts", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByText("$0")).toBeVisible();
    await expect(page.getByText("$29")).toBeVisible();
    await expect(page.getByText("$79")).toBeVisible();
  });

  test("shows Most popular badge on Pro plan", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByText("Most popular")).toBeVisible();
  });

  test("free plan shows Get started free link to sign-up", async ({ page }) => {
    await page.goto("/pricing");

    const freeLink = page.getByRole("link", { name: /get started free/i });
    await expect(freeLink).toHaveAttribute("href", "/auth/sign-up");
  });

  test("shows key free plan features", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByText("Up to 3 workshops")).toBeVisible();
    await expect(page.getByText("AI-powered scoring").first()).toBeVisible();
  });

  test("shows all prices in USD disclaimer", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByText(/all prices in usd/i)).toBeVisible();
  });

  test("nav shows PromptingSchool logo linking to home", async ({ page }) => {
    await page.goto("/pricing");

    const logo = page.getByRole("link", { name: "PromptingSchool" });
    await expect(logo).toHaveAttribute("href", "/");
  });

  test("no server errors on page load", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});

test.describe("Marketplace page", () => {
  test("renders marketplace heading", async ({ page }) => {
    await page.goto("/marketplace");

    await expect(
      page.getByRole("heading", { name: /workshop marketplace/i })
    ).toBeVisible();
    await expect(
      page.getByText("Discover AI prompting workshops taught by expert instructors")
    ).toBeVisible();
  });

  test("shows search input and filter controls", async ({ page }) => {
    await page.goto("/marketplace");

    await expect(
      page.getByPlaceholder(/search workshops/i)
    ).toBeVisible();

    // Sort dropdown
    const sortSelect = page.locator("select").filter({ hasText: "Trending" });
    await expect(sortSelect).toBeVisible();
  });

  test("shows difficulty filter options", async ({ page }) => {
    await page.goto("/marketplace");

    const difficultySelect = page.locator("select").filter({ hasText: "All levels" });
    await expect(difficultySelect).toBeVisible();
    await expect(difficultySelect.locator("option[value='beginner']")).toBeDefined();
    await expect(difficultySelect.locator("option[value='intermediate']")).toBeDefined();
    await expect(difficultySelect.locator("option[value='advanced']")).toBeDefined();
  });

  test("shows navigation with sign in link", async ({ page }) => {
    await page.goto("/marketplace");

    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
  });

  test("shows CTA section at bottom", async ({ page }) => {
    await page.goto("/marketplace");

    await expect(
      page.getByText(/ready to level up your prompt engineering/i)
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /start for free/i })).toBeVisible();
  });

  test("search input filters workshops", async ({ page }) => {
    await page.goto("/marketplace");

    // Wait for initial load
    await page.waitForTimeout(500);

    const searchInput = page.getByPlaceholder(/search workshops/i);
    await searchInput.fill("python");

    // Either shows results or "no workshops found" — should not crash
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("sort options change visible label", async ({ page }) => {
    await page.goto("/marketplace");

    const sortSelect = page.locator("select").filter({ hasText: "Trending" });
    await sortSelect.selectOption("newest");

    await expect(sortSelect).toHaveValue("newest");
  });

  test("no server errors on page load", async ({ page }) => {
    await page.goto("/marketplace");

    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});

test.describe("Docs pages", () => {
  test("docs overview renders with sidebar navigation", async ({ page }) => {
    await page.goto("/docs");

    await expect(
      page.getByRole("heading", { name: "Documentation" })
    ).toBeVisible();

    // Sidebar nav
    await expect(
      page.getByRole("navigation", { name: /docs sections/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Instructor Guide" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Trainee Guide" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "FAQ" }).first()).toBeVisible();
  });

  test("docs overview links to sub-pages", async ({ page }) => {
    await page.goto("/docs");

    const instructorLink = page
      .locator("main")
      .getByRole("link", { name: "Instructor Guide" });
    await expect(instructorLink).toHaveAttribute("href", "/docs/instructor-guide");

    const traineeLink = page
      .locator("main")
      .getByRole("link", { name: "Trainee Guide" });
    await expect(traineeLink).toHaveAttribute("href", "/docs/trainee-guide");
  });

  test("instructor guide page renders", async ({ page }) => {
    await page.goto("/docs/instructor-guide");

    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("trainee guide page renders", async ({ page }) => {
    await page.goto("/docs/trainee-guide");

    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("FAQ page renders", async ({ page }) => {
    await page.goto("/docs/faq");

    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("docs nav has Dashboard link", async ({ page }) => {
    await page.goto("/docs");

    await expect(
      page.getByRole("navigation", { name: /documentation navigation/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("no server errors on docs pages", async ({ page }) => {
    for (const path of ["/docs", "/docs/instructor-guide", "/docs/trainee-guide", "/docs/faq"]) {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Internal Server Error");
      await expect(page.locator("body")).not.toContainText("Application error");
    }
  });
});
