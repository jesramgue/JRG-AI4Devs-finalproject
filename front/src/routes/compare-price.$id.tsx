import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  requireAuthBeforeLoad,
  useRequireAuthRedirect,
} from "@/features/auth/route-guard";
import { getPriceComparison, type PriceComparisonResponse } from "@/features/insights/insights.api";
import { listPantryItems } from "@/features/pantry/pantry.api";

export const Route = createFileRoute("/compare-price/$id")({
  beforeLoad: requireAuthBeforeLoad,
  component: ComparePricePage,
});

function DeltaBadge({ delta }: { delta: string | null }) {
  if (!delta) return null;
  const value = parseFloat(delta);
  if (isNaN(value)) return null;

  if (value > 0) {
    return (
      <p className="text-[13px] text-destructive font-medium" data-testid="price-comparison-delta-overpaid">
        You overpaid by €{Math.abs(value).toFixed(2)} vs. the cheapest supermarket
      </p>
    );
  }
  if (value < 0) {
    return (
      <p className="text-[13px] text-emerald-700 font-medium" data-testid="price-comparison-delta-underpaid">
        You paid €{Math.abs(value).toFixed(2)} less than the cheapest supermarket
      </p>
    );
  }
  return (
    <p className="text-[13px] text-muted-foreground" data-testid="price-comparison-delta-equal">
      Same price as the cheapest supermarket
    </p>
  );
}

function ComparePricePage() {
  const authed = useRequireAuthRedirect();

  if (!authed) {
    return null;
  }

  const { id } = useParams({ from: "/compare-price/$id" });
  const [itemName, setItemName] = useState<string | null>(null);
  const [comparison, setComparison] = useState<PriceComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadComparison() {
      setIsLoading(true);
      setError(null);
      try {
        const pantryItems = await listPantryItems();
        const item = pantryItems.find((candidate) => candidate.id === id);
        if (!item) {
          throw new Error("Pantry item not found");
        }

        const result = await getPriceComparison(item.name);
        if (isMounted) {
          setItemName(item.name);
          setComparison(result);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(apiError instanceof Error ? apiError.message : "Could not load price comparison.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadComparison();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const cheapestSupermarket = comparison?.prices[0]?.supermarket ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md md:max-w-2xl pb-16">
        <header className="ios-blur sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border/60">
          <Link to="/item/$id" params={{ id }} className="flex items-center gap-1 text-primary">
            <ChevronLeft className="size-5" />
            <span className="text-[16px]">Item</span>
          </Link>
          <h1 className="text-[15px] font-semibold">Price comparison</h1>
          <span className="w-12" />
        </header>

        <main className="px-5 pt-6 space-y-4">
          <section className="ios-card p-4" data-testid="price-comparison-header">
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">
              Selected item
            </p>
            <p className="mt-2 text-[18px] font-semibold" data-testid="price-comparison-item-name">
              {itemName ?? "-"}
            </p>
          </section>

          {isLoading && (
            <section className="ios-card p-4" data-testid="price-comparison-loading">
              <p className="text-muted-foreground">Loading price comparison...</p>
            </section>
          )}

          {error && !isLoading && (
            <section className="ios-card p-4" data-testid="price-comparison-error">
              <p className="text-destructive">{error}</p>
            </section>
          )}

          {!isLoading && !error && comparison?.found && comparison.prices.length > 0 && (
            <section className="ios-card p-4 space-y-3" data-testid="price-comparison-result">
              <p className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">
                Reference prices by supermarket
              </p>

              <ul className="divide-y divide-border/60" data-testid="price-comparison-supermarket-list">
                {comparison.prices.map((price) => (
                  <li
                    key={price.supermarket}
                    className="flex items-center justify-between py-2"
                    data-testid={`price-comparison-row-${price.supermarket}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium">{price.supermarket}</span>
                      {price.supermarket === cheapestSupermarket && (
                        <span
                          className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"
                          data-testid="price-comparison-cheapest-badge"
                        >
                          cheapest
                        </span>
                      )}
                    </div>
                    <span className="text-[15px] font-semibold">€{Number(price.referencePriceEur).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <p className="text-[12px] text-muted-foreground">
                Manually curated reference prices, not live — may not reflect current in-store prices.
              </p>

              <DeltaBadge delta={comparison.delta} />
            </section>
          )}

          {!isLoading && !error && comparison && !comparison.found && (
            <section className="ios-card p-4 space-y-2" data-testid="price-comparison-no-data">
              <p className="text-[16px] font-semibold">No data available</p>
              <p className="text-[13px] text-muted-foreground" data-testid="price-comparison-guidance">
                We do not have a reference price for this product yet. Try comparing another pantry
                item or check again after the catalog is updated.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
