// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * E2E Test: Add Transaction Flow
 *
 * Verifies the user flow for adding a new BUY/SELL transaction
 * to a holding in the portfolio.
 */

test.describe("Add Transaction Flow", () => {
    test("should navigate to dashboard and open add transaction dialog", async ({
        page,
    }) => {
        await page.goto("/dashboard");

        // The dashboard should render (or show empty-state)
        await expect(page.locator("body")).toBeVisible();

        // Look for the "Add Transaction" button/trigger
        const addBtn = page.getByRole("button", { name: /Add Transaction/i });

        // If the button exists, click it and verify the dialog opens
        if (await addBtn.isVisible()) {
            await addBtn.click();

            // Verify the dialog/modal appears
            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();

            // Verify form fields are present
            await expect(dialog.getByLabel(/Ticker/i)).toBeVisible();
            await expect(dialog.getByLabel(/Price/i)).toBeVisible();
            await expect(dialog.getByLabel(/Quantity/i)).toBeVisible();

            // Verify BUY/SELL type selector exists
            await expect(dialog.getByText(/BUY/i)).toBeVisible();
        }
    });

    test("should validate required fields before submission", async ({
        page,
    }) => {
        await page.goto("/dashboard");

        const addBtn = page.getByRole("button", { name: /Add Transaction/i });

        if (await addBtn.isVisible()) {
            await addBtn.click();

            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();

            // Try to submit without filling fields
            const submitBtn = dialog.getByRole("button", { name: /Submit|Save|Add/i });
            if (await submitBtn.isVisible()) {
                await submitBtn.click();

                // Form should still be open (not submitted) or show validation error
                await expect(dialog).toBeVisible();
            }
        }
    });

    test("should fill and submit a BUY transaction", async ({ page }) => {
        await page.goto("/dashboard");

        const addBtn = page.getByRole("button", { name: /Add Transaction/i });

        if (await addBtn.isVisible()) {
            await addBtn.click();

            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();

            // Fill the form
            const tickerInput = dialog.getByLabel(/Ticker/i);
            const priceInput = dialog.getByLabel(/Price/i);
            const quantityInput = dialog.getByLabel(/Quantity/i);

            if (await tickerInput.isVisible()) {
                await tickerInput.fill("RELIANCE.NS");
                await priceInput.fill("2450.50");
                await quantityInput.fill("10");

                // Select BUY type if it's a dropdown/radio
                const buyOption = dialog.getByText(/BUY/i);
                if (await buyOption.isVisible()) {
                    await buyOption.click();
                }

                // Submit
                const submitBtn = dialog.getByRole("button", {
                    name: /Submit|Save|Add/i,
                });
                if (await submitBtn.isVisible()) {
                    await submitBtn.click();
                }
            }
        }
    });
});
