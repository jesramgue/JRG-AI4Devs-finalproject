-- CreateTable
CREATE TABLE "PriceCatalogItem" (
    "id" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,
    "supermarket" TEXT NOT NULL,
    "referencePriceEur" DECIMAL(10,2) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "effectiveDate" DATE NOT NULL,
    "sourceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceCatalogItem_normalizedName_supermarket_effectiveDate_idx" ON "PriceCatalogItem"("normalizedName", "supermarket", "effectiveDate");

-- Seed baseline multi-supermarket reference dataset.
-- Manually curated approximate prices for common Spanish grocery items across
-- major chains. No live/external price integration is used (see EXT-011) —
-- this dataset must be refreshed manually and is explicitly not real-time.
INSERT INTO "PriceCatalogItem" (
    "id", "normalizedName", "category", "supermarket",
    "referencePriceEur", "currencyCode", "effectiveDate", "sourceLabel"
)
VALUES
    -- whole milk (1L)
    ('pcat-whole-milk-mercadona-20260801', 'whole milk', 'Dairy', 'Mercadona', 0.95, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-whole-milk-dia-20260801', 'whole milk', 'Dairy', 'Dia', 0.89, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-whole-milk-carrefour-20260801', 'whole milk', 'Dairy', 'Carrefour', 1.05, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-whole-milk-eroski-20260801', 'whole milk', 'Dairy', 'Eroski', 1.15, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-whole-milk-alcampo-20260801', 'whole milk', 'Dairy', 'Alcampo', 1.02, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- olive oil (1L)
    ('pcat-olive-oil-mercadona-20260801', 'olive oil', 'Pantry', 'Mercadona', 6.49, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-olive-oil-dia-20260801', 'olive oil', 'Pantry', 'Dia', 6.15, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-olive-oil-carrefour-20260801', 'olive oil', 'Pantry', 'Carrefour', 6.99, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-olive-oil-eroski-20260801', 'olive oil', 'Pantry', 'Eroski', 7.20, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-olive-oil-alcampo-20260801', 'olive oil', 'Pantry', 'Alcampo', 6.65, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- tomato sauce (400g)
    ('pcat-tomato-sauce-mercadona-20260801', 'tomato sauce', 'Pantry', 'Mercadona', 0.62, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-tomato-sauce-dia-20260801', 'tomato sauce', 'Pantry', 'Dia', 0.55, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-tomato-sauce-carrefour-20260801', 'tomato sauce', 'Pantry', 'Carrefour', 0.68, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-tomato-sauce-eroski-20260801', 'tomato sauce', 'Pantry', 'Eroski', 0.75, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-tomato-sauce-alcampo-20260801', 'tomato sauce', 'Pantry', 'Alcampo', 0.65, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- white bread (loaf)
    ('pcat-white-bread-mercadona-20260801', 'white bread', 'Bakery', 'Mercadona', 0.85, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-white-bread-dia-20260801', 'white bread', 'Bakery', 'Dia', 0.79, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-white-bread-carrefour-20260801', 'white bread', 'Bakery', 'Carrefour', 0.95, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-white-bread-eroski-20260801', 'white bread', 'Bakery', 'Eroski', 1.05, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-white-bread-alcampo-20260801', 'white bread', 'Bakery', 'Alcampo', 0.89, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- eggs (dozen)
    ('pcat-eggs-mercadona-20260801', 'eggs', 'Dairy', 'Mercadona', 2.35, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-eggs-dia-20260801', 'eggs', 'Dairy', 'Dia', 2.19, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-eggs-carrefour-20260801', 'eggs', 'Dairy', 'Carrefour', 2.49, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-eggs-eroski-20260801', 'eggs', 'Dairy', 'Eroski', 2.65, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-eggs-alcampo-20260801', 'eggs', 'Dairy', 'Alcampo', 2.40, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- rice (1kg)
    ('pcat-rice-mercadona-20260801', 'rice', 'Pantry', 'Mercadona', 1.15, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-rice-dia-20260801', 'rice', 'Pantry', 'Dia', 1.05, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-rice-carrefour-20260801', 'rice', 'Pantry', 'Carrefour', 1.25, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-rice-eroski-20260801', 'rice', 'Pantry', 'Eroski', 1.35, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-rice-alcampo-20260801', 'rice', 'Pantry', 'Alcampo', 1.18, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- pasta (500g)
    ('pcat-pasta-mercadona-20260801', 'pasta', 'Pantry', 'Mercadona', 0.68, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-pasta-dia-20260801', 'pasta', 'Pantry', 'Dia', 0.62, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-pasta-carrefour-20260801', 'pasta', 'Pantry', 'Carrefour', 0.75, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-pasta-eroski-20260801', 'pasta', 'Pantry', 'Eroski', 0.82, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-pasta-alcampo-20260801', 'pasta', 'Pantry', 'Alcampo', 0.70, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- sugar (1kg)
    ('pcat-sugar-mercadona-20260801', 'sugar', 'Pantry', 'Mercadona', 0.95, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-sugar-dia-20260801', 'sugar', 'Pantry', 'Dia', 0.89, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-sugar-carrefour-20260801', 'sugar', 'Pantry', 'Carrefour', 1.02, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-sugar-eroski-20260801', 'sugar', 'Pantry', 'Eroski', 1.10, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-sugar-alcampo-20260801', 'sugar', 'Pantry', 'Alcampo', 0.98, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- coffee (250g)
    ('pcat-coffee-mercadona-20260801', 'coffee', 'Pantry', 'Mercadona', 2.85, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-coffee-dia-20260801', 'coffee', 'Pantry', 'Dia', 2.65, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-coffee-carrefour-20260801', 'coffee', 'Pantry', 'Carrefour', 3.05, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-coffee-eroski-20260801', 'coffee', 'Pantry', 'Eroski', 3.25, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-coffee-alcampo-20260801', 'coffee', 'Pantry', 'Alcampo', 2.95, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- bananas (1kg)
    ('pcat-bananas-mercadona-20260801', 'bananas', 'Produce', 'Mercadona', 1.35, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-bananas-dia-20260801', 'bananas', 'Produce', 'Dia', 1.25, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-bananas-carrefour-20260801', 'bananas', 'Produce', 'Carrefour', 1.45, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-bananas-eroski-20260801', 'bananas', 'Produce', 'Eroski', 1.55, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-bananas-alcampo-20260801', 'bananas', 'Produce', 'Alcampo', 1.40, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- chicken breast (1kg)
    ('pcat-chicken-breast-mercadona-20260801', 'chicken breast', 'Meat', 'Mercadona', 6.95, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-chicken-breast-dia-20260801', 'chicken breast', 'Meat', 'Dia', 6.49, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-chicken-breast-carrefour-20260801', 'chicken breast', 'Meat', 'Carrefour', 7.35, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-chicken-breast-eroski-20260801', 'chicken breast', 'Meat', 'Eroski', 7.60, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-chicken-breast-alcampo-20260801', 'chicken breast', 'Meat', 'Alcampo', 7.10, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),

    -- yogurt (pack of 4)
    ('pcat-yogurt-mercadona-20260801', 'yogurt', 'Dairy', 'Mercadona', 1.05, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-yogurt-dia-20260801', 'yogurt', 'Dairy', 'Dia', 0.95, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-yogurt-carrefour-20260801', 'yogurt', 'Dairy', 'Carrefour', 1.15, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-yogurt-eroski-20260801', 'yogurt', 'Dairy', 'Eroski', 1.25, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026'),
    ('pcat-yogurt-alcampo-20260801', 'yogurt', 'Dairy', 'Alcampo', 1.10, 'EUR', DATE '2026-08-01', 'Manually curated reference, Aug 2026');
