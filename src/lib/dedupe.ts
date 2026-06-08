import { cleanProductName } from "./taxonomy";
import type { ProductRow, SiteId } from "./types";

const COLOR_TOKENS =
  "blanc|noir|beige|gris|grise|rouge|bordeaux|marron|rose|vert|bleu|anthracite|taupe|laque|laquee|cerise|sauge|kaki|ecru|ivoire|camel|ocre|terracotta|ardoise|naturel|moka|sable|creme|cream|emeraude|prune|violet|orange|jaune|moutarde|navy|lin|chocolat|miel|corail|lilas|menthe|aubergine|cuivre|dore|argent|chrome|ebene|ebène|noyer|chene|chêne|walnut|oak|walnut";

const COLOR_SEGMENT_RE = new RegExp(
  `\\s*-\\s*(${COLOR_TOKENS})(\\s+[^-]+)?(?=\\s*-|$)`,
  "gi",
);

const TRAILING_COLOR_RE = new RegExp(`\\s+(${COLOR_TOKENS})\\s*$`, "i");
const URL_COLOR_RE = new RegExp(`-(${COLOR_TOKENS})(?=-|$)`, "gi");

const MATERIAL_PATTERNS = [
  /\ben\s+(velours(?:\s+cotele)?(?:\s+grosses\s+cotes)?|tissu(?:\s+texture)?|fausse\s+fourrure(?:\s+cotele)?|jute|lin|cuir|bois|metal|acier|resine(?:\s+tressee)?|chenille|bouclette|coton|polyester|marbre|verre|cotele|capitonne)\b/i,
  /\b(velours|coton|polyester|chenille|jute|lin|cuir|resine tressee|tissu|bouclette|marbre|verre|metal|acier|bois)(?:\s+et\s+(velours|coton|polyester|chenille|jute|lin))?/i,
];

export interface VariantProduct {
  site: SiteId;
  product_name: string;
  collection_name?: string | null;
  category_name?: string;
  review_count: number;
  price_cents?: number | null;
  price_text?: string | null;
  product_url?: string;
}

export interface ParentProductGroup<T extends VariantProduct = VariantProduct> {
  parentKey: string;
  representative: T;
  variants: T[];
  displayName: string;
  priceRangeText: string | null;
  reviewCount: number;
  variantCount: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripUrlVariantHints(url: string): string {
  try {
    const parsed = new URL(url);
    let slug = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    slug = slug.replace(/\.html?$/i, "");
    slug = slug.replace(/-p\d+.*$/i, "");
    slug = slug.replace(/#/g, " ");
    slug = slug.replace(URL_COLOR_RE, " ");
    slug = slug.replace(/couleur-[a-z]+/gi, " ");
    slug = slug.replace(/-taille-[a-z0-9]+/gi, " ");
    return normalize(slug.replace(/-/g, " "));
  } catch {
    return "";
  }
}

/** Stem nom seul (sans URL) — utilisé pour la clé parent et l'affichage. */
export function extractNameStem(name: string): string {
  let stem = cleanProductName(name);

  stem = stem.replace(/^édition limitée\s*-\s*/i, "");
  stem = stem.replace(/\s*-\s*design by\s+.+$/i, "");
  stem = stem.replace(/\s*design by\s+.+$/i, "");

  const plusIndex = stem.search(/\s\+\s*\d/);
  if (plusIndex > 0) {
    stem = stem.slice(0, plusIndex);
  }

  stem = stem.replace(/\d+\s*x\s*\d+([.,]\d+)?\s*m/gi, " ");
  stem = stem.replace(/\d+([.,]\d+)?\s*cm/gi, " ");
  stem = stem.replace(/\d+\s*places?/gi, " ");

  let normalized = normalize(stem);
  normalized = normalized.replace(COLOR_SEGMENT_RE, " ");
  normalized = normalized.replace(TRAILING_COLOR_RE, "");
  normalized = normalized.replace(/\s*-\s*$/g, "");
  normalized = normalized.replace(/\s+(palace|triomphe|imperial|flash)\s*$/i, "");
  return normalized.replace(/\s+/g, " ").trim();
}

/** @deprecated Utiliser extractNameStem */
export function extractProductStem(name: string, productUrl?: string): string {
  const stem = extractNameStem(name);
  if (!productUrl) return stem;
  const urlStem = stripUrlVariantHints(productUrl);
  if (!urlStem) return stem;
  return `${stem} ${urlStem}`.replace(/\s+/g, " ").trim();
}

/** Libellé parent affiché (sans couleur). */
export function formatDisplayParentName(name: string): string {
  let display = cleanProductName(name);
  display = display.replace(COLOR_SEGMENT_RE, "");
  display = display.replace(TRAILING_COLOR_RE, "");
  display = display.replace(/\s*-\s*$/g, "").replace(/\s+/g, " ").trim();
  return display;
}

export function extractMaterial(name: string): string {
  const cleaned = cleanProductName(name);
  for (const pattern of MATERIAL_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      return normalize(match[0]);
    }
  }
  return "";
}

export function priceCentsFromProduct(product: VariantProduct): number | null {
  if (product.price_cents != null && product.price_cents > 0) {
    return product.price_cents;
  }
  if (!product.price_text) return null;
  const match = product.price_text.match(/(\d[\d\s]*[.,]\d{2}|\d[\d\s]*)/);
  if (!match) return null;
  const normalized = match[1].replace(/\s/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

function formatEuros(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function formatPriceRangeText(variants: VariantProduct[]): string | null {
  const cents = variants
    .map(priceCentsFromProduct)
    .filter((value): value is number => value != null && value > 0);
  if (!cents.length) {
    const texts = [...new Set(variants.map((v) => v.price_text).filter(Boolean))] as string[];
    if (texts.length === 1) return texts[0];
    if (texts.length > 1) return `${texts[0]} – ${texts[texts.length - 1]}`;
    return null;
  }
  const min = Math.min(...cents);
  const max = Math.max(...cents);
  if (min === max) return formatEuros(min);
  return `${formatEuros(min)} – ${formatEuros(max)}`;
}

/**
 * Clé parent : même nom (hors couleur) + matière (+ collection si connue).
 * Le prix est ignoré — les déclinaisons couleur à prix différent = 1 référence.
 */
export function parentReferenceKey(product: VariantProduct): string {
  const stem = extractNameStem(product.product_name);
  const material = extractMaterial(product.product_name);
  const collection = product.collection_name?.trim();

  if (collection) {
    return `${product.site}|col:${normalize(collection)}|${stem}|${material}`;
  }

  if (stem.length < 8 && product.product_url) {
    const urlStem = stripUrlVariantHints(product.product_url);
    return `${product.site}|${stem}|${urlStem}|${material}`;
  }

  return `${product.site}|${stem}|${material}`;
}

export function collapseToParentGroups<T extends VariantProduct>(items: T[]): ParentProductGroup<T>[] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = parentReferenceKey(item);
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  }

  return [...groups.entries()].map(([parentKey, variants]) => {
    const sorted = [...variants].sort(
      (a, b) => (b.review_count ?? 0) - (a.review_count ?? 0) || (b.price_cents ?? 0) - (a.price_cents ?? 0),
    );
    const representative = sorted[0];
    const reviewCount = Math.max(...variants.map((v) => v.review_count ?? 0));

    return {
      parentKey,
      representative,
      variants,
      displayName: formatDisplayParentName(representative.product_name),
      priceRangeText: formatPriceRangeText(variants),
      reviewCount,
      variantCount: variants.length,
    };
  });
}

export function dedupeToParentReferences<T extends VariantProduct>(items: T[]): T[] {
  return collapseToParentGroups(items).map((group) => group.representative);
}

export function dedupeVariants<T extends VariantProduct>(items: T[], limit: number): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = parentReferenceKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

function latestUrlProducts(products: ProductRow[], site?: SiteId): ProductRow[] {
  const map = new Map<string, ProductRow>();
  for (const p of products) {
    if (site && p.site !== site) continue;
    const key = `${p.site}|${p.product_url}`;
    const existing = map.get(key);
    if (!existing || p.scraped_at > existing.scraped_at) {
      map.set(key, p);
    }
  }
  return [...map.values()];
}

/** Produit parent enrichi pour l'affichage (nom sans couleur, fourchette de prix). */
export function toDisplayParentRow(group: ParentProductGroup<VariantProduct & ProductRow>): ProductRow {
  const base = group.representative;
  return {
    ...base,
    product_name: group.displayName,
    price_text: group.priceRangeText ?? base.price_text,
    review_count: group.reviewCount,
  };
}

/** Dernier état par URL puis 1 ligne par référence parent. */
export function latestParentProducts(products: ProductRow[], site?: SiteId): ProductRow[] {
  const latest = latestUrlProducts(products, site);
  const groups = collapseToParentGroups(
    latest.map((p) => ({
      ...p,
      review_count: p.review_count ?? 0,
    })),
  );
  return groups.map(toDisplayParentRow);
}

export function latestParentGroups(
  products: ProductRow[],
  site?: SiteId,
): ParentProductGroup<VariantProduct & ProductRow>[] {
  const latest = latestUrlProducts(products, site);
  return collapseToParentGroups(
    latest.map((p) => ({
      ...p,
      review_count: p.review_count ?? 0,
    })),
  );
}
