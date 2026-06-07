import { dedupeVariants } from "./dedupe";
import { classifyProduct, cleanProductName, TAXONOMY } from "./taxonomy";
import type {
  BestSellerProduct,
  MacroCategoryCount,
  NoveltyMatrixCell,
  NoveltyProduct,
  ProductRow,
  ProductTreeData,
  SiteId,
} from "./types";
import { COMPETITORS } from "./types";
import { guessProductImageUrl } from "./images";

function latestByUrl(products: ProductRow[]): Map<string, ProductRow> {
  const map = new Map<string, ProductRow>();
  for (const p of products) {
    const key = `${p.site}|${p.product_url}`;
    const existing = map.get(key);
    if (!existing || p.scraped_at > existing.scraped_at) {
      map.set(key, p);
    }
  }
  return map;
}

function earliestByUrl(products: ProductRow[]): Map<string, ProductRow> {
  const map = new Map<string, ProductRow>();
  for (const p of products) {
    const key = `${p.site}|${p.product_url}`;
    const existing = map.get(key);
    if (!existing || p.scraped_at < existing.scraped_at) {
      map.set(key, p);
    }
  }
  return map;
}

function firstReviewCount(product: ProductRow, firstSnapshots: Map<string, ProductRow>): number {
  if (product.first_review_count != null) {
    return product.first_review_count;
  }
  const first = firstSnapshots.get(`${product.site}|${product.product_url}`);
  return first?.review_count ?? 0;
}

/** Jour du premier scrape par site = base de référence (pas de nouveautés ce jour-là). */
function getSiteBaselineDay(products: ProductRow[], site: SiteId): string | null {
  const days = products
    .filter((p) => p.site === site)
    .map((p) => p.scraped_at.slice(0, 10));
  if (!days.length) return null;
  return days.reduce((min, day) => (day < min ? day : min));
}

/**
 * Vrai nouveau = apparu après le jour de référence ET sans avis à la première collecte.
 */
function collectTrueNoveltyKeys(products: ProductRow[]): Set<string> {
  const first = earliestByUrl(products);
  const keys = new Set<string>();

  for (const [key, firstSnap] of first) {
    const baselineDay = getSiteBaselineDay(products, firstSnap.site);
    const firstDay = firstSnap.scraped_at.slice(0, 10);

    if (baselineDay && firstDay <= baselineDay) continue;
    if (firstReviewCount(firstSnap, first) > 0) continue;

    keys.add(key);
  }

  return keys;
}

export function buildProductTree(site: SiteId, products: ProductRow[]): ProductTreeData {
  const siteProducts = [...latestByUrl(products.filter((p) => p.site === site)).values()];
  const total = siteProducts.length;

  const macroCounts = new Map<string, Map<string, number>>();
  for (const macro of TAXONOMY) {
    macroCounts.set(macro.id, new Map(macro.subcategories.map((s) => [s.id, 0])));
  }

  for (const product of siteProducts) {
    const { macroId, subId } = classifyProduct(product);
    const subMap = macroCounts.get(macroId) ?? new Map();
    subMap.set(subId, (subMap.get(subId) ?? 0) + 1);
    macroCounts.set(macroId, subMap);
  }

  const categories: MacroCategoryCount[] = TAXONOMY.map((macro) => {
    const subMap = macroCounts.get(macro.id) ?? new Map();
    const subcategories = macro.subcategories
      .map((sub) => ({
        id: sub.id,
        label: sub.label,
        count: subMap.get(sub.id) ?? 0,
      }))
      .filter((s) => s.count > 0);

    const count = subcategories.reduce((sum, s) => sum + s.count, 0);
    return {
      id: macro.id,
      label: macro.label,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      subcategories,
    };
  }).filter((c) => c.count > 0);

  const competitor = COMPETITORS.find((c) => c.id === site);
  return {
    site,
    label: competitor?.label ?? site,
    total,
    categories,
  };
}

export function buildAllProductTrees(products: ProductRow[]): ProductTreeData[] {
  return COMPETITORS.map((c) => buildProductTree(c.id, products));
}

export function buildNoveltyMatrix(products: ProductRow[]): NoveltyMatrixCell[] {
  const latest = latestByUrl(products);
  const trueNewUrls = collectTrueNoveltyKeys(products);

  const cells = new Map<string, NoveltyMatrixCell>();
  for (const macro of TAXONOMY) {
    for (const sub of macro.subcategories) {
      const id = `${macro.id}|${sub.id}`;
      cells.set(id, {
        macroId: macro.id,
        macroLabel: macro.label,
        subId: sub.id,
        subLabel: sub.label,
        counts: { bestmobilier: 0, bobochic: 0, sweeek: 0, baita: 0, habitat: 0 },
      });
    }
  }

  for (const key of trueNewUrls) {
    const product = latest.get(key);
    if (!product) continue;
    const { macroId, subId } = classifyProduct(product);
    const cellKey = `${macroId}|${subId}`;
    const cell = cells.get(cellKey);
    if (cell) {
      cell.counts[product.site] += 1;
    }
  }

  return [...cells.values()].filter((c) => Object.values(c.counts).some((n) => n > 0));
}

export function buildTopNoveltiesBySite(
  products: ProductRow[],
  limit = 10,
): Record<SiteId, NoveltyProduct[]> {
  const latest = latestByUrl(products);
  const first = earliestByUrl(products);
  const trueNewUrls = collectTrueNoveltyKeys(products);
  const result = {} as Record<SiteId, NoveltyProduct[]>;

  for (const competitor of COMPETITORS) {
    const site = competitor.id;
    const candidates: NoveltyProduct[] = [];

    for (const key of trueNewUrls) {
      if (!key.startsWith(`${site}|`)) continue;
      const current = latest.get(key);
      const firstSnap = first.get(key);
      if (!current || !firstSnap) continue;

      const currentReviews = current.review_count ?? 0;
      candidates.push({
        site,
        product_url: current.product_url,
        product_name: cleanProductName(current.product_name),
        category_name: current.category_name,
        collection_name: current.collection_name,
        review_count: currentReviews,
        review_growth: currentReviews,
        price_text: current.price_text,
        image_url: current.image_url ?? guessProductImageUrl(site, current.product_url),
        detected_at: firstSnap.scraped_at,
      });
    }

    candidates.sort((a, b) => b.review_growth - a.review_growth || b.review_count - a.review_count);
    result[site] = dedupeVariants(candidates, limit);
  }

  return result;
}

export function buildBestSellers(products: ProductRow[], limit = 10): Record<SiteId, BestSellerProduct[]> {
  const latest = latestByUrl(products);
  const first = earliestByUrl(products);
  const result = {} as Record<SiteId, BestSellerProduct[]>;

  for (const competitor of COMPETITORS) {
    const site = competitor.id;
    const siteProducts = [...latest.values()].filter((p) => p.site === site);

    const mapped: BestSellerProduct[] = siteProducts.map((p) => {
      const currentReviews = p.review_count ?? 0;
      const firstReviews = firstReviewCount(p, first);
      return {
        site,
        product_url: p.product_url,
        product_name: cleanProductName(p.product_name),
        category_name: p.category_name,
        collection_name: p.collection_name,
        review_count: currentReviews,
        review_growth: Math.max(0, currentReviews - firstReviews),
        price_text: p.price_text,
        image_url: p.image_url ?? guessProductImageUrl(site, p.product_url),
      };
    });

    mapped.sort((a, b) => b.review_count - a.review_count);
    result[site] = dedupeVariants(
      mapped.filter((p) => p.review_count > 0),
      limit,
    );
  }

  return result;
}

export function buildTopReviewGrowth(products: ProductRow[], limit = 10): Record<SiteId, BestSellerProduct[]> {
  const latest = latestByUrl(products);
  const first = earliestByUrl(products);
  const result = {} as Record<SiteId, BestSellerProduct[]>;

  for (const competitor of COMPETITORS) {
    const site = competitor.id;
    const siteProducts = [...latest.values()].filter((p) => p.site === site);

    const mapped: BestSellerProduct[] = siteProducts.map((p) => {
      const currentReviews = p.review_count ?? 0;
      const firstReviews = firstReviewCount(p, first);
      return {
        site,
        product_url: p.product_url,
        product_name: cleanProductName(p.product_name),
        category_name: p.category_name,
        collection_name: p.collection_name,
        review_count: currentReviews,
        review_growth: Math.max(0, currentReviews - firstReviews),
        price_text: p.price_text,
        image_url: p.image_url ?? guessProductImageUrl(site, p.product_url),
      };
    });

    mapped.sort((a, b) => b.review_growth - a.review_growth || b.review_count - a.review_count);
    result[site] = dedupeVariants(
      mapped.filter((p) => p.review_growth > 0),
      limit,
    );
  }

  return result;
}
