import { expect, test, type Page } from "@playwright/test";
import { registerUser, seedSession } from "../notifications/_helpers";

const FRONT_BASE_URL = process.env.E2E_FRONT_BASE_URL ?? "http://localhost:5173";

const MOCK_PANTRY_ITEM_ID = "pantry-item-1";
const MOCK_ITEM_NAME = "Leche Entera";

const MOCK_MULTI_SUPERMARKET_RESPONSE = {
  normalizedName: "leche entera",
  found: true,
  prices: [
    { supermarket: "Dia", referencePriceEur: "0.72", effectiveDate: "2026-08-01T00:00:00.000Z" },
    { supermarket: "Mercadona", referencePriceEur: "0.89", effectiveDate: "2026-08-01T00:00:00.000Z" },
    { supermarket: "Carrefour", referencePriceEur: "1.05", effectiveDate: "2026-08-01T00:00:00.000Z" },
  ],
  receiptContext: { latestUnitPriceEur: "0.89", latestObservedAt: null },
  delta: "0.17",
  unavailableReason: null,
};

const MOCK_NO_DATA_RESPONSE = {
  normalizedName: "leche entera",
  found: false,
  prices: [],
  receiptContext: { latestUnitPriceEur: null, latestObservedAt: null },
  delta: null,
  unavailableReason: "NO_REFERENCE_DATA",
};

async function mockPantryList(page: Page) {
  await page.route("**/pantry/items**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: MOCK_PANTRY_ITEM_ID,
          name: MOCK_ITEM_NAME,
          quantity: 1,
          unit: "unit",
          pricePaid: 0.89,
          expirationDate: null,
          createdAt: new Date().toISOString(),
        },
      ]),
    });
  });
}

test.describe("Price comparison across supermarkets", () => {
  test("ranks supermarkets cheapest-first and flags the cheapest one", async ({ page, request }) => {
    const email = `price-cmp-e2e-${Date.now()}@example.com`;
    const auth = await registerUser(request, email);

    await seedSession(page, auth);
    await mockPantryList(page);

    await page.route("**/insights/price-comparison**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_MULTI_SUPERMARKET_RESPONSE),
      });
    });

    await page.goto(`${FRONT_BASE_URL}/compare-price/${MOCK_PANTRY_ITEM_ID}`);

    await expect(page.getByTestId("price-comparison-supermarket-list")).toBeVisible({ timeout: 8000 });

    const rows = page.getByTestId("price-comparison-supermarket-list").locator("li");
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText("Dia");
    await expect(rows.first()).toContainText("€0.72");
    await expect(page.getByTestId("price-comparison-row-Dia").getByTestId("price-comparison-cheapest-badge")).toBeVisible();
    await expect(page.getByText(/overpaid/i)).toBeVisible();
  });

  test("shows no-data state when nothing is found", async ({ page, request }) => {
    const email = `price-cmp-e2e-nodata-${Date.now()}@example.com`;
    const auth = await registerUser(request, email);

    await seedSession(page, auth);
    await mockPantryList(page);

    await page.route("**/insights/price-comparison**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_NO_DATA_RESPONSE),
      });
    });

    await page.goto(`${FRONT_BASE_URL}/compare-price/${MOCK_PANTRY_ITEM_ID}`);

    await expect(page.getByTestId("price-comparison-no-data")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("price-comparison-supermarket-list")).toHaveCount(0);
  });
});
