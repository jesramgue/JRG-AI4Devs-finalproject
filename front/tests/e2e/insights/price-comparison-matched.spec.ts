import { expect, test } from "@playwright/test";
import { createPantryItem, registerUser, seedSession } from "../notifications/_helpers";

const FRONT_BASE_URL = process.env.E2E_FRONT_BASE_URL ?? "http://localhost:5173";

test.describe("Price comparison matched flow", () => {
  test("opens compare price from pantry item and renders multi-supermarket reference prices", async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const auth = await registerUser(request, `pw.ext011.matched.${ts}@insights-e2e.example.com`);

    // "Whole Milk" matches the seeded catalog entries across several supermarkets.
    await createPantryItem(request, auth.accessToken, "Whole Milk", 5);

    await seedSession(page, auth);
    await page.goto(`${FRONT_BASE_URL}/pantry`);
    await page.getByText("Whole Milk", { exact: true }).click();

    const compareAction = page.getByTestId("compare-price-action");
    await expect(compareAction).toHaveAttribute("href", /compare-price/);
    await Promise.all([page.waitForURL(/\/compare-price\//), compareAction.click()]);

    await expect(page.getByTestId("price-comparison-result")).toBeVisible();
    await expect(page.getByTestId("price-comparison-item-name")).toContainText("Whole Milk");
    await expect(page.getByTestId("price-comparison-supermarket-list")).toBeVisible();
    await expect(page.getByTestId("price-comparison-cheapest-badge")).toBeVisible();
    await expect(page.getByTestId("price-comparison-no-data")).toHaveCount(0);
  });
});
