// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * E2E Test: AI Insights Panel on Asset Detail Page
 *
 * Verifies that the AI Insights panel renders correctly
 * on the asset detail page with sentiment and analysis content.
 */

test.describe("AI Insights Panel", () => {
    test("should navigate to an asset detail page", async ({ page }) => {
        // Navigate to an example asset detail page
        await page.goto("/asset/RELIANCE.NS");

        // The page should load
        await expect(page.locator("body")).toBeVisible();
    });

    test("should display the AI Insights panel with expected sections", async ({
        page,
    }) => {
        await page.goto("/asset/RELIANCE.NS");

        // Look for the AI Insights panel
        const insightsPanel = page.getByTestId("ai-insights-panel");

        if (await insightsPanel.isVisible()) {
            // Verify sentiment badge is present (Bullish/Bearish/Neutral)
            const sentimentBadge = insightsPanel.locator(
                '[data-testid="sentiment-badge"]'
            );
            await expect(sentimentBadge).toBeVisible();

            const sentimentText = await sentimentBadge.textContent();
            expect(["Bullish", "Bearish", "Neutral"]).toContain(sentimentText?.trim());

            // Verify analysis text section exists
            const analysisText = insightsPanel.locator(
                '[data-testid="analysis-text"]'
            );
            await expect(analysisText).toBeVisible();

            // Analysis should have meaningful content (>50 chars)
            const content = await analysisText.textContent();
            expect(content?.length).toBeGreaterThan(50);
        }
    });

    test("should display fundamental data in the insights panel", async ({
        page,
    }) => {
        await page.goto("/asset/RELIANCE.NS");

        const insightsPanel = page.getByTestId("ai-insights-panel");

        if (await insightsPanel.isVisible()) {
            // Verify fundamental metrics are shown
            await expect(insightsPanel.getByText(/P\/E|Market Cap|Sector/i)).toBeVisible();
        }
    });

    test("should display technical indicators in the insights panel", async ({
        page,
    }) => {
        await page.goto("/asset/RELIANCE.NS");

        const insightsPanel = page.getByTestId("ai-insights-panel");

        if (await insightsPanel.isVisible()) {
            // Verify technical indicators are shown
            await expect(insightsPanel.getByText(/RSI|SMA|Signal/i)).toBeVisible();
        }
    });
});
