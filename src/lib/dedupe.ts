import { cleanProductName } from "./taxonomy";
import type { SiteId } from "./types";

const COLOR_TOKENS =
  "blanc|noir|beige|gris|grise|rouge|bordeaux|marron|rose|vert|bleu|anthracite|taupe|laqué|laquee|cerise|sauge|kaki|ecru|écru|ivoire|camel|ocre|terracotta|ardoise|naturel";

const COLOR_SEGMENT_RE = new RegExp(
  `\\s*-\\s*(${COLOR_TOKENS})(\\s+[^-]+)?(?=\\s*-|$)`,
  "gi",
);

interface VariantProduct {
  site: SiteId;
  product_name: string;
  collection_name?: string | null;
  category_name?: string;
  review_count: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDesigner(name: string): string | null {
  const match = name.match(/design by\s+(.+?)(?:\s*$|\s*-)/i);
  return match ? normalize(match[1]) : null;
}

/**
 * Réduit un libellé produit à sa "famille" (hors couleur, taille, bundles).
 */
export function extractProductStem(name: string): string {
  let stem = cleanProductName(name);

  stem = stem.replace(/^édition limitée\s*-\s*/i, "");
  stem = stem.replace(/\s*-\s*design by\s+.+$/i, "");
  stem = stem.replace(/\s*design by\s+.+$/i, "");

  // Bundles Sweeek : "Pergola ... + 1 store 3m + ..."
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
  normalized = normalized.replace(/\s+/g, " ").trim();

  // Retire le nom de collection en suffixe (ex. "... Palace")
  normalized = normalized.replace(/\s+(palace|triomphe|imperial|flash)\s*$/i, "");

  return normalized;
}

const FAMILY_KEYWORDS = [
  "bain de soleil",
  "salon de jardin",
  "table à manger",
  "table a manger",
  "table basse",
  "meuble tv",
  "pergola",
  "canapé",
  "canape",
  "fauteuil",
  "chaise",
  "lit",
  "matelas",
  "armoire",
  "buffet",
  "commode",
  "lampe",
  "lustre",
  "suspension",
  "tapis",
  "pouf",
  "buffet",
];

function stemPrefix(stem: string, words = 4): string {
  return stem.split(" ").filter(Boolean).slice(0, words).join(" ");
}

function inferProductFamily(stem: string): string {
  const n = normalize(stem);
  const sorted = [...FAMILY_KEYWORDS].sort((a, b) => b.length - a.length);
  for (const keyword of sorted) {
    if (n.includes(normalize(keyword))) {
      return normalize(keyword);
    }
  }
  return stemPrefix(stem, 4);
}

/**
 * Clé de regroupement des variantes (couleur, dimension, bundle).
 * Les variantes partagent souvent le même nombre d'avis.
 */
export function variantGroupKey(product: VariantProduct): string {
  const stem = extractProductStem(product.product_name);
  const collection = product.collection_name?.trim();
  const designer = extractDesigner(product.product_name);
  const family = inferProductFamily(stem);

  // Regroupe les avis proches (variantes partagent souvent le même pool ± quelques avis)
  const reviewBucket = Math.floor(product.review_count / 10) * 10;

  // Collection + famille + avis (ex. Sweeek Triomphe pergolas à ~855 avis)
  if (collection) {
    return `${product.site}|col:${normalize(collection)}|fam:${family}|rev:${reviewBucket}`;
  }

  // Designer + famille (ex. Habitat × Claire Norcross, mêmes avis partagés)
  if (designer) {
    return `${product.site}|des:${designer}|fam:${family}|rev:${reviewBucket}`;
  }

  return `${product.site}|fam:${family}|rev:${reviewBucket}|${stemPrefix(stem, 4)}`;
}

/** Garde un seul représentant par famille de variantes dans un top N déjà trié. */
export function dedupeVariants<T extends VariantProduct>(items: T[], limit: number): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = variantGroupKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}
