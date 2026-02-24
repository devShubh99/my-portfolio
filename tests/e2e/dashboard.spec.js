// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * E2E Test: Portfolio Dashboard Rendering
 *
 * Verifies that the main portfolio dashboard page loads correctly
 * and displays the expected UI elements.
 */

test.describe("Portfolio Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("should render the landing page with hero section", async ({ page }) => {
        // Verify the main heading is visible
        await expect(page.locator("h1")).toContainText("StockFolio");

        // Verify the tagline is visible
        await expect(page.locator("main")).toContainText(
            "Your personal Indian stock market command centre"
        );
    });

    test("should display all three feature cards", async ({ page }) => {
        // Check that all three feature cards are rendered
        await expect(page.getByText("Live Portfolios")).toBeVisible();
        await expect(page.getByText("Technical Analysis")).toBeVisible();
        await expect(page.getByText("AI Insights")).toBeVisible();
    });

    test("should have a working CTA button to dashboard", async ({ page }) => {
        const ctaLink = page.getByRole("link", { name: /Open Dashboard/i });
        await expect(ctaLink).toBeVisible();
        await expect(ctaLink).toHaveAttribute("href", "/dashboard");
    });

    test("should render in dark mode by default", async ({ page }) => {
        const html = page.locator("html");
        await expect(html).toHaveClass(/dark/);
    });
});
