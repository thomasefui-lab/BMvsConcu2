/**
 * Vérifie le regroupement parent sur des cas Habitat-type (Aleya canapé).
 * npx tsx scripts/test-dedupe-habitat.ts
 */
import { collapseToParentGroups, formatDisplayParentName, formatPriceRangeText } from "../src/lib/dedupe";
import type { ProductRow, SiteId } from "../src/lib/types";
import { getProductsByCategory } from "../src/lib/analytics";

function row(partial: Partial<ProductRow> & Pick<ProductRow, "product_name" | "product_url">): ProductRow {
  return {
    site: "habitat",
    category_name: "Canapés",
    category_url: "https://www.habitat.fr/canapes",
    collection_name: "Aleya",
    price_cents: partial.price_cents ?? null,
    price_text: partial.price_text ?? null,
    review_count: partial.review_count ?? 0,
    badges: null,
    position: null,
    scraped_at: "2026-06-01T00:00:00Z",
    ...partial,
  };
}

const aleyaVariants: ProductRow[] = [
  row({
    product_name: "Aleya canapé 3 places - beige",
    product_url: "https://www.habitat.fr/p/aleya-canape-3-places-beige",
    price_cents: 44900,
    price_text: "449,00 €",
    review_count: 12,
  }),
  row({
    product_name: "Aleya canapé 3 places - bleu",
    product_url: "https://www.habitat.fr/p/aleya-canape-3-places-bleu",
    price_cents: 49900,
    price_text: "499,00 €",
    review_count: 28,
  }),
  row({
    product_name: "Aleya canapé 3 places - gris anthracite",
    product_url: "https://www.habitat.fr/p/aleya-canape-3-places-gris-anthracite",
    price_cents: 44900,
    price_text: "449,00 €",
    review_count: 5,
  }),
];

const groups = collapseToParentGroups(aleyaVariants.map((p) => ({ ...p, review_count: p.review_count ?? 0 })));

console.log("=== Test Aleya canapé 3 places (synthétique) ===\n");
console.log(`Variantes: ${aleyaVariants.length} → Groupes: ${groups.length}`);
if (groups.length !== 1) {
  console.error("FAIL: attendu 1 groupe parent");
  process.exit(1);
}

const g = groups[0];
console.log(`Nom affiché: ${g.displayName}`);
console.log(`Prix: ${g.priceRangeText}`);
console.log(`Avis (max): ${g.reviewCount}`);
console.log(`URL représentative: ${g.representative.product_url}`);
console.log(`Variantes: ${g.variantCount}`);

const expectedName = "Aleya canapé 3 places";
if (!g.displayName.toLowerCase().includes("aleya") || g.displayName.toLowerCase().includes("beige")) {
  console.error(`FAIL: nom affiché inattendu: ${g.displayName}`);
  process.exit(1);
}

if (!g.priceRangeText?.includes("449") || !g.priceRangeText?.includes("499")) {
  console.error(`FAIL: fourchette de prix inattendue: ${g.priceRangeText}`);
  process.exit(1);
}

if (g.reviewCount !== 28) {
  console.error(`FAIL: avis max attendu 28, reçu ${g.reviewCount}`);
  process.exit(1);
}

if (!g.representative.product_url.includes("bleu")) {
  console.error("FAIL: représentant devrait être la variante bleu (plus d'avis)");
  process.exit(1);
}

// getProductsByCategory integration
const salonProducts = getProductsByCategory("habitat" as SiteId, aleyaVariants, {
  macroId: "salon",
  subId: "canape",
});
console.log(`\ngetProductsByCategory (salon/canapés): ${salonProducts.length} ligne(s)`);
if (salonProducts.length > 0) {
  console.log(`  → ${salonProducts[0].product_name} | ${salonProducts[0].price_text} | ${salonProducts[0].review_count} avis`);
}

console.log("\nOK — regroupement parent Habitat validé.");
