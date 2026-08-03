# EXT-011 — Multi-Supermarket Price Comparison (Static Catalog)

## Metadata
- **Type:** Full-Stack (Backend + Frontend + Data)
- **Priority:** P2
- **Phase:** 2 — Growth
- **Depends on:** TKT-006 (original price-comparison MVP — removed, see Context)

---

## User Story

As a user, I want to see how the price I paid for a pantry item compares against reference
prices at several Spanish supermarket chains, so I can judge whether I got a good deal and
which chain tends to be cheapest for the things I buy.

---

## Context

This feature previously existed in two iterations:

1. **TKT-006** shipped a price-comparison MVP backed by a single static `PriceCatalogItem`
   reference table (one price per normalized product name, no external calls).
2. **EXT-008** extended it with a *live* price integration that reverse-engineered
   Mercadona's internal Algolia search endpoint (hardcoded, unauthorized third-party
   credentials; 24h in-memory cache; fallback to the static catalog).

Commit `f4a9eff` ("Remove Mercadona price-comparison feature") removed the entire vertical —
live integration, endpoint, frontend route, tests — **explicitly to avoid third-party Terms
of Service and credential-security concerns**. The unofficial endpoint had also proven
unreliable (404s during manual testing). The follow-up commit `ef78edb` dropped the
now-unused `PriceCatalogItem` table.

This ticket revives the feature **without any live scraping or third-party API calls**,
and extends it beyond a single reference price to a **static, manually-curated catalog
covering multiple Spanish supermarket chains** (Mercadona, Carrefour, Dia, Eroski,
Alcampo) per product, so users can compare across chains rather than against one
anonymous "reference" value.

**Live/external price integration is explicitly out of scope for this ticket and any
future one**, per the prior ToS decision — see Non-Goals.

---

## Affected Slices

| Slice | Path | Change |
|---|---|---|
| Prisma schema | `back/prisma/schema.prisma` | Add `PriceCatalogItem` model (multi-supermarket) |
| Migration | `back/prisma/migrations/` | Create table + seed baseline dataset |
| Backend — module | `back/src/modules/insights/` | `price-comparison-normalizer.ts`, `dto/price-comparison-query.dto.ts`, `getPriceComparison` on `InsightsService`, `GET /insights/price-comparison` on `InsightsController` |
| Frontend — features | `front/src/features/insights/insights.api.ts` | `getPriceComparison()` + response types |
| Frontend — routes | `front/src/routes/compare-price.$id.tsx` | Ranked multi-supermarket list UI |
| Frontend — routes | `front/src/routes/item.$id.tsx` | "Compare prices" action link |

---

## API Contract

```
GET /api/insights/price-comparison?normalizedName=<string>
Authorization: Bearer <JWT>

Response 200:
{
  normalizedName: string
  found: boolean
  prices: Array<{ supermarket: string; referencePriceEur: string; effectiveDate: string }>  // sorted cheapest-first
  receiptContext: { latestUnitPriceEur: string | null; latestObservedAt: string | null }
  delta: string | null   // latestUnitPriceEur - cheapest referencePriceEur
  unavailableReason: "NO_REFERENCE_DATA" | null
}
```

---

## Data Model

```prisma
model PriceCatalogItem {
  id                String   @id @default(uuid())
  normalizedName    String
  category          String?
  supermarket       String
  referencePriceEur Decimal  @db.Decimal(10, 2)
  currencyCode      String   @default("EUR")
  effectiveDate     DateTime @db.Date
  sourceLabel       String?
  createdAt         DateTime @default(now())

  @@index([normalizedName, supermarket, effectiveDate])
}
```

One row per (product, supermarket, effective date). The service resolves the latest
`effectiveDate` row per supermarket for a given normalized name.

---

## Data Sourcing (the core tradeoff of this ticket)

No live external calls are made. The catalog is **manually curated and must be refreshed
by hand** (editing seed data / adding new migrations) — there is no automated freshness
guarantee. This is the accepted tradeoff for avoiding the ToS and credential risk that
caused the previous live integration's removal. The UI must make this explicit (see
Acceptance Criteria).

---

## Acceptance Criteria

1. `GET /insights/price-comparison?normalizedName=whole milk` returns one entry per
   supermarket that stocks the item, sorted cheapest-first.
2. When no supermarket has a matching entry, the response returns `found: false` and
   `unavailableReason: "NO_REFERENCE_DATA"`.
3. `delta` is computed as the user's latest matching receipt unit price minus the
   cheapest catalog price, and is `null` when either side is missing.
4. The endpoint requires authentication (401 for unauthenticated requests).
5. The pantry item detail page has a "Compare prices" action linking to
   `/compare-price/:id`.
6. The compare-price page renders supermarkets ranked cheapest-first, flags the cheapest
   one, and states that prices are manually curated reference values, not live.
7. No third-party HTTP calls, API keys, or scraped endpoints are introduced.

---

## Testing Requirements

| Test type | Coverage |
|---|---|
| Unit — `InsightsService.getPriceComparison` | multi-supermarket sort, latest-effective-date dedup, no-match fallback, delta calc, receipt matching after normalization |
| E2E (Jest/supertest) — `insights.e2e-spec.ts` | auth requirement, real DB round-trip for matched/unmatched cases |
| E2E (Playwright) — `tests/e2e/insights/price-comparison*.spec.ts` | pantry item → compare-price navigation, ranked list rendering, no-data state |

---

## Non-Goals

- **Live/external price integration of any kind** (scraping, unofficial APIs, paid data
  feeds) — ruled out for ToS and credential-security reasons; this decision should not be
  revisited without an explicit, authorized data-partnership.
- Automated catalog refresh — out of scope; refreshing prices is a manual maintenance task.
- Per-user geolocation / regional pricing — a single national reference price per chain is
  sufficient.
- Price history / trend charts — only the current reference price is shown.
