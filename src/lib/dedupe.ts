import { cleanProductName } from "./taxonomy";
import type { ProductRow, SiteId } from "./types";

const COLOR_TOKENS =
  "blanc|noir|beige|gris|grise|rouge|bordeaux|marron|rose|vert|bleu|anthracite|taupe|laque|laquee|cerise|sauge|kaki|ecru|ecru|ivoire|camel|ocre|terracotta|ardoise|naturel|moka|sable|creme|cream|anthracite|emeraude|prune|violet|orange|jaune|moutarde|navy|lin|chocolat|miel|corail|lilas|menthe|aubergine|cuivre|dore|argent|chrome";

const COLOR_SEGMENT_RE = new RegExp(
  `\\s*-\\s*(${COLOR_TOKENS})(\\s+[^-]+)?(?=\\s*-|$)`,
  "gi",
);

const URL_COLOR_RE = new RegExp(`-(${COLOR_TOKENS})(?=-|$)`, "gi");

const MATERIAL_PATTERNS = [
  /\ben\s+(velours(?:\s+cotele)?(?:\s+grosses\s+cotes)?|tissu(?:\s+texture)?|fausse\s+fourrure(?:\s+cotele)?|jute|lin|cuir|bois|metal|acier|resine(?:\s+tressee)?|chenille|bouclette|coton|polyester|marbre|verre)\b/i,
  /\b(velours|coton|polyester|chenille|jute|lin|cuir|resine tressee|resine tressee|tissu|bouclette|marbre|verre|metal|acier|bois)(?:\s+et\s+(velours|coton|polyester|chenille|jute|lin))?/i,
];

interface VariantProduct {
  site: SiteId;
  product_name: string;
  collection_name?: string | null;
  category_name?: string;
  review_count: number;
  price_cents?: number | null;
  price_text?: string | null;
  product_url?: string;
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
    return normalize(slug.replace(/-/g, " "));
  } catch {
    return "";
  }
}

/**
 * Réduit un libellé produit à sa référence parent (hors couleur, bundle).
 * Les dimensions (cm, places) sont conservées — ce sont des vraies variantes.
 */
export function extractProductStem(name: string, productUrl?: string): string {
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
  normalized = normalized.replace(/\s*-\s*$/g, "");
  normalized = normalized.replace(/\s+(palace|triomphe|imperial|flash)\s*$/i, "");
  normalized = normalized.replace(/\s+/g, " ").trim();

  if (productUrl) {
    const urlStem = stripUrlVariantHints(productUrl);
    if (urlStem) {
      normalized = `${normalized} ${urlStem}`.replace(/\s+/g, " ").trim();
    }
  }

  return normalized;
}

/** Extrait la matière du libellé (ex. « en velours côtelé », « polyester et coton »). */
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

export function normalizePrice(priceCents: number | null | undefined, priceText: string | null | undefined): string {
  if (priceCents != null && priceCents > 0) {
    return String(priceCents);
  }
  if (!priceText) return "";
  const digits = priceText.replace(/[^\d]/g, "");
  return digits || "";
}

/**
 * Clé de référence parent : même nom (hors couleur), même prix, même matière → 1 produit.
 */
export function parentReferenceKey(product: VariantProduct): string {
  const stem = extractProductStem(product.product_name, product.product_url);
  const material = extractMaterial(product.product_name);
  const price = normalizePrice(product.price_cents, product.price_text);
  return `${product.site}|${stem}|${material}|${price}`;
}

/**
 * Ne conserve qu'une référence parent par groupe de déclinaisons couleur.
 * Garde le représentant avec le plus d'avis.
 */
export function dedupeToParentReferences<T extends VariantProduct>(items: T[]): T[] {
  const best = new Map<string, T>();

  for (const item of items) {
    const key = parentReferenceKey(item);
    const existing = best.get(key);
    if (!existing || item.review_count > existing.review_count) {
      best.set(key, item);
    }
  }

  return [...best.values()];
}

/** Garde un seul représentant par famille de variantes dans un top N déjà trié. */
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

/** Dernier état par URL puis réduction aux références parent. */
export function latestParentProducts(products: ProductRow[], site?: SiteId): ProductRow[] {
  const map = new Map<string, ProductRow>();
  for (const p of products) {
    if (site && p.site !== site) continue;
    const key = `${p.site}|${p.product_url}`;
    const existing = map.get(key);
    if (!existing || p.scraped_at > existing.scraped_at) {
      map.set(key, p);
    }
  }
  return dedupeToParentReferences(
    [...map.values()].map((p) => ({
      ...p,
      review_count: p.review_count ?? 0,
    })),
  );
}
