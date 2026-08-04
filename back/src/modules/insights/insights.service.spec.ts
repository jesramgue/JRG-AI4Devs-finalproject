import { ForbiddenException } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/library";
import { InsightsService } from "./insights.service";

describe("InsightsService — getPriceComparison", () => {
  const user = { id: "user-1", email: "user@example.com" };

  function makeCatalogRow(overrides: {
    id: string;
    normalizedName: string;
    supermarket: string;
    referencePriceEur: string;
    effectiveDate: string;
  }) {
    return {
      id: overrides.id,
      normalizedName: overrides.normalizedName,
      category: "Dairy",
      supermarket: overrides.supermarket,
      referencePriceEur: new Decimal(overrides.referencePriceEur),
      currencyCode: "EUR",
      effectiveDate: new Date(overrides.effectiveDate),
      sourceLabel: "Manually curated reference",
      createdAt: new Date(overrides.effectiveDate),
    };
  }

  function createService(options?: {
    catalogRows?: ReturnType<typeof makeCatalogRow>[];
    receiptItems?: { rawName: string; unitPriceEur: Decimal | null; createdAt: Date }[];
  }) {
    const catalogRows = options?.catalogRows ?? [];
    const receiptItems = options?.receiptItems ?? [];

    const prismaMock = {
      priceCatalogItem: {
        findMany: jest.fn(async ({ where }: any) => {
          return catalogRows
            .filter((row) => row.normalizedName === where.normalizedName)
            .sort(
              (a, b) =>
                b.effectiveDate.getTime() - a.effectiveDate.getTime() ||
                b.createdAt.getTime() - a.createdAt.getTime(),
            );
        }),
      },
      receiptItem: {
        findMany: jest.fn().mockResolvedValue(receiptItems),
      },
    } as any;

    const usersServiceMock = {
      findById: jest.fn(async (id: string) => (id === user.id ? user : null)),
    } as any;

    return { service: new InsightsService(prismaMock, usersServiceMock) };
  }

  it("returns prices for every matching supermarket, sorted cheapest-first", async () => {
    const { service } = createService({
      catalogRows: [
        makeCatalogRow({
          id: "1",
          normalizedName: "whole milk",
          supermarket: "Mercadona",
          referencePriceEur: "0.95",
          effectiveDate: "2026-08-01T00:00:00.000Z",
        }),
        makeCatalogRow({
          id: "2",
          normalizedName: "whole milk",
          supermarket: "Dia",
          referencePriceEur: "0.89",
          effectiveDate: "2026-08-01T00:00:00.000Z",
        }),
        makeCatalogRow({
          id: "3",
          normalizedName: "whole milk",
          supermarket: "Carrefour",
          referencePriceEur: "1.05",
          effectiveDate: "2026-08-01T00:00:00.000Z",
        }),
      ],
    });

    const result = await service.getPriceComparison(user.id, "Whole Milk");

    expect(result.found).toBe(true);
    expect(result.prices.map((p) => p.supermarket)).toEqual(["Dia", "Mercadona", "Carrefour"]);
    expect(result.prices[0].referencePriceEur).toBe("0.89");
  });

  it("keeps only the latest effective-date row per supermarket", async () => {
    const { service } = createService({
      catalogRows: [
        makeCatalogRow({
          id: "old",
          normalizedName: "whole milk",
          supermarket: "Mercadona",
          referencePriceEur: "1.49",
          effectiveDate: "2026-06-01T00:00:00.000Z",
        }),
        makeCatalogRow({
          id: "latest",
          normalizedName: "whole milk",
          supermarket: "Mercadona",
          referencePriceEur: "0.95",
          effectiveDate: "2026-08-01T00:00:00.000Z",
        }),
      ],
    });

    const result = await service.getPriceComparison(user.id, "whole milk");

    expect(result.prices).toHaveLength(1);
    expect(result.prices[0].referencePriceEur).toBe("0.95");
  });

  it("returns found: false and NO_REFERENCE_DATA when no supermarket has the item", async () => {
    const { service } = createService();

    const result = await service.getPriceComparison(user.id, "Unknown Product");

    expect(result.found).toBe(false);
    expect(result.prices).toEqual([]);
    expect(result.unavailableReason).toBe("NO_REFERENCE_DATA");
  });

  it("computes delta as (latest receipt unit price - cheapest catalog price)", async () => {
    const { service } = createService({
      catalogRows: [
        makeCatalogRow({
          id: "1",
          normalizedName: "leche",
          supermarket: "Dia",
          referencePriceEur: "0.89",
          effectiveDate: "2026-08-01T00:00:00.000Z",
        }),
      ],
      receiptItems: [{ rawName: "leche", unitPriceEur: new Decimal("1.06"), createdAt: new Date() }],
    });

    const result = await service.getPriceComparison(user.id, "leche");

    expect(result.receiptContext.latestUnitPriceEur).toBe("1.06");
    expect(result.delta).toBe("0.17");
  });

  it("sets delta: null when no matching receipt item exists", async () => {
    const { service } = createService({
      catalogRows: [
        makeCatalogRow({
          id: "1",
          normalizedName: "leche",
          supermarket: "Dia",
          referencePriceEur: "0.89",
          effectiveDate: "2026-08-01T00:00:00.000Z",
        }),
      ],
    });

    const result = await service.getPriceComparison(user.id, "leche");

    expect(result.receiptContext.latestUnitPriceEur).toBeNull();
    expect(result.delta).toBeNull();
  });

  it("matches receipt items after normalizing rawName (accents, case, quantity noise)", async () => {
    const { service } = createService({
      catalogRows: [
        makeCatalogRow({
          id: "1",
          normalizedName: "leche",
          supermarket: "Dia",
          referencePriceEur: "0.89",
          effectiveDate: "2026-08-01T00:00:00.000Z",
        }),
      ],
      receiptItems: [{ rawName: "  LECHÉ ", unitPriceEur: new Decimal("1.10"), createdAt: new Date() }],
    });

    const result = await service.getPriceComparison(user.id, "leche");

    expect(result.receiptContext.latestUnitPriceEur).toBe("1.1");
  });

  it("throws ForbiddenException for unknown user", async () => {
    const { service } = createService();

    await expect(service.getPriceComparison("unknown-user", "leche")).rejects.toThrow(ForbiddenException);
  });
});

describe("InsightsService — getWasteMetrics", () => {
  const user = { id: "user-1", email: "user@example.com" };

  function makeService(aggResult: {
    _sum: { quantity: number | null; estimatedValueEur: Decimal | null };
    _count: { id: number };
  }) {
    const prismaMock = {
      priceCatalogItem: { findMany: jest.fn() },
      receiptItem: { findMany: jest.fn() },
      consumptionEvent: {
        aggregate: jest.fn().mockResolvedValue(aggResult),
      },
    } as any;

    const usersServiceMock = {
      findById: jest.fn(async (id: string) => (id === user.id ? user : null)),
    } as any;

    return new InsightsService(prismaMock, usersServiceMock);
  }

  it("returns zero metrics when no waste events exist", async () => {
    const service = makeService({
      _sum: { quantity: null, estimatedValueEur: null },
      _count: { id: 0 },
    });

    const result = await service.getWasteMetrics(user.id);

    expect(result.totalWastedQuantity).toBe(0);
    expect(result.totalWastedValueEur).toBe("0.00");
    expect(result.eventCount).toBe(0);
  });

  it("aggregates quantity and value across waste events", async () => {
    const service = makeService({
      _sum: { quantity: 5, estimatedValueEur: new Decimal("12.50") },
      _count: { id: 3 },
    });

    const result = await service.getWasteMetrics(user.id);

    expect(result.totalWastedQuantity).toBe(5);
    expect(result.totalWastedValueEur).toBe("12.50");
    expect(result.eventCount).toBe(3);
  });

  it("handles events with no estimated value (null pricePaid)", async () => {
    const service = makeService({
      _sum: { quantity: 2, estimatedValueEur: null },
      _count: { id: 2 },
    });

    const result = await service.getWasteMetrics(user.id);

    expect(result.totalWastedQuantity).toBe(2);
    expect(result.totalWastedValueEur).toBe("0.00");
    expect(result.eventCount).toBe(2);
  });

  it("throws ForbiddenException for unknown user", async () => {
    const service = makeService({
      _sum: { quantity: null, estimatedValueEur: null },
      _count: { id: 0 },
    });

    await expect(service.getWasteMetrics("unknown-user")).rejects.toThrow(ForbiddenException);
  });
});
