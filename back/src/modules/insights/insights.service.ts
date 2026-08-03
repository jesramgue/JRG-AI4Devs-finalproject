import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UsersService } from "../users/users.service";
import { normalizePriceComparisonName } from "./price-comparison-normalizer";

export interface WasteMetricsResponse {
  totalWastedQuantity: number;
  totalWastedValueEur: string;
  eventCount: number;
}

export interface SupermarketPrice {
  supermarket: string;
  referencePriceEur: string;
  effectiveDate: string;
}

export interface PriceComparisonReceiptContext {
  latestUnitPriceEur: string | null;
  latestObservedAt: string | null;
}

export interface PriceComparisonResponse {
  normalizedName: string;
  found: boolean;
  prices: SupermarketPrice[];
  receiptContext: PriceComparisonReceiptContext;
  delta: string | null;
  unavailableReason: "NO_REFERENCE_DATA" | null;
}

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getWasteMetrics(userId: string): Promise<WasteMetricsResponse> {
    await this.assertUserCanAccessInsights(userId);

    const agg = await this.prisma.consumptionEvent.aggregate({
      where: { userId, type: "WASTED" },
      _sum: { quantity: true, estimatedValueEur: true },
      _count: { id: true },
    });

    return {
      totalWastedQuantity: agg._sum.quantity ?? 0,
      totalWastedValueEur: agg._sum.estimatedValueEur?.toFixed(2) ?? "0.00",
      eventCount: agg._count.id,
    };
  }

  async getPriceComparison(userId: string, inputNormalizedName: string): Promise<PriceComparisonResponse> {
    await this.assertUserCanAccessInsights(userId);

    const normalizedName = normalizePriceComparisonName(inputNormalizedName);

    const [catalogRows, latestReceiptItem] = await Promise.all([
      this.prisma.priceCatalogItem.findMany({
        where: { normalizedName },
        orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
      }),
      this.findLatestMatchingReceiptItem(userId, normalizedName),
    ]);

    const latestBySupermarket = new Map<string, (typeof catalogRows)[number]>();
    for (const row of catalogRows) {
      if (!latestBySupermarket.has(row.supermarket)) {
        latestBySupermarket.set(row.supermarket, row);
      }
    }

    const prices: SupermarketPrice[] = Array.from(latestBySupermarket.values())
      .map((row) => ({
        supermarket: row.supermarket,
        referencePriceEur: row.referencePriceEur.toString(),
        effectiveDate: row.effectiveDate.toISOString(),
      }))
      .sort((a, b) => parseFloat(a.referencePriceEur) - parseFloat(b.referencePriceEur));

    const receiptContext: PriceComparisonReceiptContext = {
      latestUnitPriceEur: latestReceiptItem?.unitPriceEur?.toString() ?? null,
      latestObservedAt: latestReceiptItem?.createdAt.toISOString() ?? null,
    };

    const cheapest = prices[0] ?? null;
    const delta = this.computeDelta(receiptContext.latestUnitPriceEur, cheapest?.referencePriceEur ?? null);

    const found = prices.length > 0;
    const unavailableReason = found ? null : "NO_REFERENCE_DATA";

    return {
      normalizedName,
      found,
      prices,
      receiptContext,
      delta,
      unavailableReason,
    };
  }

  private computeDelta(pricePaidStr: string | null, cheapestStr: string | null): string | null {
    if (!pricePaidStr || !cheapestStr) {
      return null;
    }
    const pricePaid = parseFloat(pricePaidStr);
    const cheapest = parseFloat(cheapestStr);
    if (isNaN(pricePaid) || isNaN(cheapest)) {
      return null;
    }
    return (pricePaid - cheapest).toFixed(2);
  }

  private async findLatestMatchingReceiptItem(userId: string, normalizedName: string) {
    const receiptItems = await this.prisma.receiptItem.findMany({
      where: { receipt: { userId } },
      orderBy: { createdAt: "desc" },
      select: { rawName: true, unitPriceEur: true, createdAt: true },
      take: 50,
    });

    return (
      receiptItems.find((item) => {
        if (!item.unitPriceEur) {
          return false;
        }
        return normalizePriceComparisonName(item.rawName) === normalizedName;
      }) ?? null
    );
  }

  private async assertUserCanAccessInsights(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new ForbiddenException("No access to insights");
    }
  }
}
