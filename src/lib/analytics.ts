import {
  EMPTY_OVERRIDES,
  getEffectiveClassification,
  getSubcategoryLabel,
  subcategoriesForMacro,
  type TaxonomyOverrides,
} from "./classification-overrides";
import {
  collapseToParentGroups,
  latestParentGroups,
  parentReferenceKey,
  toDisplayParentRow,
} from "./dedupe";
import { cleanProductName, TAXONOMY } from "./taxonomy";
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

function collectionKey(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ensureMacroMaps(
  macroId: string,
  macroCounts: Map<string, Map<string, number>>,
  macroCollections: Map<string, Set<string>>,
  subCollections: Map<string, Map<string, Set<string>>>,
) {
  if (!macroCounts.has(macroId)) {
    macroCounts.set(macroId, new Map());
    macroCollections.set(macroId, new Set());
    subCollections.set(macroId, new Map());
  }
}

export function buildProductTree(
  site: SiteId,
  products: ProductRow[],
  overrides: TaxonomyOverrides = EMPTY_OVERRIDES,
): ProductTreeData {
  const parentGroups = latestParentGroups(products, site);
  const total = parentGroups.length;

  const macroCounts = new Map<string, Map<string, number>>();
  const macroCollections = new Map<string, Set<string>>();
  const subCollections = new Map<string, Map<string, Set<string>>>();
  const totalCollections = new Set<string>();

  for (const group of parentGroups) {
    const product = group.representative;
    const { macroId, subId } = getEffectiveClassification(product, overrides);
    ensureMacroMaps(macroId, macroCounts, macroCollections, subCollections);

    const subMap = macroCounts.get(macroId)!;
    subMap.set(subId, (subMap.get(subId) ?? 0) + 1);

    const coll = collectionKey(product.collection_name);
    if (!coll) continue;

    totalCollections.add(coll);
    macroCollections.get(macroId)!.add(coll);
    const subCollMap = subCollections.get(macroId)!;
    const subSet = subCollMap.get(subId) ?? new Set<string>();
    subSet.add(coll);
    subCollMap.set(subId, subSet);
  }

  const categories: MacroCategoryCount[] = TAXONOMY.map((macro) => {
    const subMap = macroCounts.get(macro.id) ?? new Map();
    const subCollMap = subCollections.get(macro.id) ?? new Map();
    const subIds = subcategoriesForMacro(macro.id, overrides);
    const subcategories = subIds
      .map((subId) => ({
        id: subId,
        label: getSubcategoryLabel(subId),
        count: subMap.get(subId) ?? 0,
        collectionCount: subCollMap.get(subId)?.size ?? 0,
      }))
      .filter((s) => s.count > 0);

    const count = subcategories.reduce((sum, s) => sum + s.count, 0);
    return {
      id: macro.id,
      label: macro.label,
      count,
      collectionCount: macroCollections.get(macro.id)?.size ?? 0,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      subcategories,
    };
  }).filter((c) => c.count > 0);

  const competitor = COMPETITORS.find((c) => c.id === site);
  return {
    site,
    label: competitor?.label ?? site,
    total,
    totalCollections: totalCollections.size,
    categories,
  };
}

export function buildAllProductTrees(
  products: ProductRow[],
  overrides: TaxonomyOverrides = EMPTY_OVERRIDES,
): ProductTreeData[] {
  return COMPETITORS.map((c) => buildProductTree(c.id, products, overrides));
}

export interface CategoryProductFilter {
  macroId: string;
  subId?: string;
}

export function getProductsByCategory(
  site: SiteId,
  products: ProductRow[],
  filter: CategoryProductFilter,
  overrides: TaxonomyOverrides = EMPTY_OVERRIDES,
): ProductRow[] {
  return latestParentGroups(products, site)
    .filter((group) => {
      const { macroId, subId } = getEffectiveClassification(group.representative, overrides);
      if (macroId !== filter.macroId) return false;
      if (filter.subId && subId !== filter.subId) return false;
      return true;
    })
    .map(toDisplayParentRow)
    .sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0));
}

export function buildNoveltyMatrix(
  products: ProductRow[],
  overrides: TaxonomyOverrides = EMPTY_OVERRIDES,
): NoveltyMatrixCell[] {
  const latest = latestByUrl(products);
  const trueNewUrls = collectTrueNoveltyKeys(products);

  const cells = new Map<string, NoveltyMatrixCell>();
  const parentKeysByCell = new Map<string, Record<SiteId, Set<string>>>();

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
      parentKeysByCell.set(id, {
        bestmobilier: new Set(),
        bobochic: new Set(),
        sweeek: new Set(),
        baita: new Set(),
        habitat: new Set(),
      });
    }
  }

  for (const key of trueNewUrls) {
    const product = latest.get(key);
    if (!product) continue;
    const { macroId, subId } = getEffectiveClassification(product, overrides);
    const cellKey = `${macroId}|${subId}`;
    const cell = cells.get(cellKey);
    const parentSets = parentKeysByCell.get(cellKey);
    if (!cell || !parentSets) continue;

    const parentKey = parentReferenceKey({
      ...product,
      review_count: product.review_count ?? 0,
    });
    parentSets[product.site].add(parentKey);
  }

  for (const [cellKey, cell] of cells) {
    const parentSets = parentKeysByCell.get(cellKey);
    if (!parentSets) continue;
    for (const competitor of COMPETITORS) {
      cell.counts[competitor.id] = parentSets[competitor.id].size;
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

    const groups = collapseToParentGroups(
      candidates.map((c) => ({
        ...c,
        product_name: c.product_name,
        review_count: c.review_count,
        product_url: c.product_url,
      })),
    );
    const mapped: NoveltyProduct[] = groups.map((group) => {
      const rep = group.representative;
      return {
        site: rep.site,
        parent_key: group.parentKey,
        product_url: rep.product_url,
        product_name: group.displayName,
        category_name: rep.category_name ?? "",
        collection_name: rep.collection_name,
        review_count: group.reviewCount,
        review_growth: Math.max(...group.variants.map((v) => (v as NoveltyProduct).review_growth ?? 0)),
        price_text: group.priceRangeText ?? rep.price_text,
        image_url: rep.image_url ?? guessProductImageUrl(site, rep.product_url),
        detected_at: (rep as NoveltyProduct).detected_at,
      };
    });
    mapped.sort((a, b) => b.review_growth - a.review_growth || b.review_count - a.review_count);
    result[site] = mapped.slice(0, limit);
  }

  return result;
}

function parentReviewGrowth(
  group: ReturnType<typeof latestParentGroups>[number],
  first: Map<string, ProductRow>,
): number {
  return Math.max(
    ...group.variants.map((variant) => {
      const row = variant as ProductRow;
      const current = row.review_count ?? 0;
      return Math.max(0, current - firstReviewCount(row, first));
    }),
  );
}

function mapParentGroupToBestSeller(
  group: ReturnType<typeof latestParentGroups>[number],
  site: SiteId,
  first: Map<string, ProductRow>,
): BestSellerProduct {
  const rep = group.representative;
  return {
    site,
    parent_key: group.parentKey,
    product_url: rep.product_url,
    product_name: group.displayName,
    category_name: rep.category_name,
    collection_name: rep.collection_name,
    review_count: group.reviewCount,
    review_growth: parentReviewGrowth(group, first),
    price_text: group.priceRangeText ?? rep.price_text,
    image_url: rep.image_url ?? guessProductImageUrl(site, rep.product_url),
  };
}

export function buildBestSellers(products: ProductRow[], limit = 10): Record<SiteId, BestSellerProduct[]> {
  const first = earliestByUrl(products);
  const result = {} as Record<SiteId, BestSellerProduct[]>;

  for (const competitor of COMPETITORS) {
    const site = competitor.id;
    const mapped = latestParentGroups(products, site)
      .filter((group) => group.reviewCount > 0)
      .map((group) => mapParentGroupToBestSeller(group, site, first));

    mapped.sort((a, b) => b.review_count - a.review_count);
    result[site] = mapped.slice(0, limit);
  }

  return result;
}

export function buildTopReviewGrowth(products: ProductRow[], limit = 10): Record<SiteId, BestSellerProduct[]> {
  const first = earliestByUrl(products);
  const result = {} as Record<SiteId, BestSellerProduct[]>;

  for (const competitor of COMPETITORS) {
    const site = competitor.id;
    const mapped = latestParentGroups(products, site)
      .map((group) => mapParentGroupToBestSeller(group, site, first))
      .filter((p) => p.review_growth > 0);

    mapped.sort((a, b) => b.review_growth - a.review_growth || b.review_count - a.review_count);
    result[site] = mapped.slice(0, limit);
  }

  return result;
}

/** Nombre total de références parent (hors déclinaisons couleur) pour l'en-tête dashboard. */
export function countParentReferences(products: ProductRow[]): number {
  return latestParentGroups(products).length;
}
