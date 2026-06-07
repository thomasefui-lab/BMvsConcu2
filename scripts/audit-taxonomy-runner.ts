/**
 * Audit taxonomie — node --import tsx scripts/audit-taxonomy-runner.ts
 * Ou avec données injectées : AUDIT_JSON='[...]' npx tsx scripts/audit-taxonomy-runner.ts
 */
import { createClient } from "@supabase/supabase-js";
import { classifyProduct, TAXONOMY } from "../src/lib/taxonomy";
import type { ProductRow, SiteId } from "../src/lib/types";

const SITES: SiteId[] = ["bestmobilier", "bobochic", "sweeek", "baita", "habitat"];

async function loadProducts(): Promise<ProductRow[]> {
  if (process.env.AUDIT_JSON) {
    return JSON.parse(process.env.AUDIT_JSON) as ProductRow[];
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Variables Supabase manquantes");
  }

  const client = createClient(url, key);
  const all: ProductRow[] = [];
  let from = 0;
  const page = 1000;

  while (true) {
    const { data, error } = await client
      .from("dashboard_products")
      .select("site,category_name,category_url,product_url,product_name,collection_name,scraped_at")
      .in("site", SITES)
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    for (const row of data) {
      all.push({
        ...row,
        site: row.site as SiteId,
        collection_name: row.collection_name ?? null,
        price_cents: null,
        price_text: null,
        review_count: null,
        badges: null,
        position: null,
        scraped_at: row.scraped_at ?? new Date().toISOString(),
      });
    }
    if (data.length < page) break;
    from += page;
  }
  return all;
}

async function main() {
  const products = await loadProducts();
  console.log(`Produits analysés : ${products.length}\n`);

  for (const site of SITES) {
    const siteProducts = products.filter((p) => p.site === site);
    const total = siteProducts.length;
    if (!total) continue;

    const macroCounts = new Map<string, Map<string, number>>();
    for (const macro of TAXONOMY) {
      macroCounts.set(macro.id, new Map());
    }

    for (const p of siteProducts) {
      const { macroId, subId } = classifyProduct(p);
      const subMap = macroCounts.get(macroId) ?? new Map();
      subMap.set(subId, (subMap.get(subId) ?? 0) + 1);
      macroCounts.set(macroId, subMap);
    }

    console.log(`=== ${site.toUpperCase()} (${total}) ===`);
    for (const macro of TAXONOMY) {
      const subMap = macroCounts.get(macro.id) ?? new Map();
      const subs = macro.subcategories
        .map((s) => ({ ...s, count: subMap.get(s.id) ?? 0 }))
        .filter((s) => s.count > 0);
      const count = subs.reduce((sum, s) => sum + s.count, 0);
      if (!count) continue;
      const pct = Math.round((count / total) * 100);
      console.log(`  ${macro.label}: ${count} (${pct}%)`);
      for (const s of subs) {
        console.log(`    - ${s.label}: ${s.count}`);
      }
    }
    console.log();
  }

  const outdoorInCanape = products.filter((p) => {
    const cat = p.category_name.toLowerCase();
    if (!cat.includes("canap")) return false;
    const { macroId } = classifyProduct(p);
    return macroId === "exterieur";
  });
  console.log(`Canapés scrapés reclassés en Extérieur : ${outdoorInCanape.length}`);
  for (const p of outdoorInCanape.slice(0, 8)) {
    console.log(`  [${p.site}] ${p.product_name.slice(0, 60)}`);
  }

  const tapisInSejour = products.filter((p) => {
    const { macroId, subId } = classifyProduct(p);
    return subId === "tapis" && /sejour|meuble/i.test(p.category_name);
  });
  console.log(`\nTapis reclassés depuis Séjour/Meuble : ${tapisInSejour.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
