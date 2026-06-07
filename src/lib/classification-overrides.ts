import { classifyProduct, TAXONOMY } from "./taxonomy";
import type { ProductRow } from "./types";

export interface TaxonomyOverrides {
  /** Sous-catégorie déplacée vers une autre macro-catégorie */
  subcategoryMacro: Record<string, string>;
  /** Réaffectation manuelle d'un produit */
  productAssignments: Record<string, { macroId: string; subId: string }>;
}

export const EMPTY_OVERRIDES: TaxonomyOverrides = {
  subcategoryMacro: {},
  productAssignments: {},
};

const STORAGE_KEY = "mobilier-taxonomy-overrides-v1";

export function productOverrideKey(site: string, productUrl: string): string {
  return `${site}|${productUrl}`;
}

export function loadOverrides(): TaxonomyOverrides {
  if (typeof window === "undefined") return { ...EMPTY_OVERRIDES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_OVERRIDES };
    const parsed = JSON.parse(raw) as TaxonomyOverrides;
    return {
      subcategoryMacro: parsed.subcategoryMacro ?? {},
      productAssignments: parsed.productAssignments ?? {},
    };
  } catch {
    return { ...EMPTY_OVERRIDES };
  }
}

export function saveOverrides(overrides: TaxonomyOverrides): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function getDefaultMacroForSub(subId: string): string | undefined {
  return TAXONOMY.find((macro) => macro.subcategories.some((sub) => sub.id === subId))?.id;
}

export function getSubcategoryLabel(subId: string): string {
  for (const macro of TAXONOMY) {
    const sub = macro.subcategories.find((s) => s.id === subId);
    if (sub) return sub.label;
  }
  return subId;
}

export function getMacroLabel(macroId: string): string {
  return TAXONOMY.find((m) => m.id === macroId)?.label ?? macroId;
}

export function getEffectiveMacroForSub(subId: string, overrides: TaxonomyOverrides): string | undefined {
  return overrides.subcategoryMacro[subId] ?? getDefaultMacroForSub(subId);
}

export function getEffectiveClassification(
  product: ProductRow,
  overrides: TaxonomyOverrides = EMPTY_OVERRIDES,
): { macroId: string; subId: string } {
  const key = productOverrideKey(product.site, product.product_url);
  const manual = overrides.productAssignments[key];
  if (manual) return manual;

  const base = classifyProduct(product);
  const macroId = overrides.subcategoryMacro[base.subId] ?? base.macroId;
  return { macroId, subId: base.subId };
}

export function moveSubcategory(
  overrides: TaxonomyOverrides,
  subId: string,
  targetMacroId: string,
): TaxonomyOverrides {
  const defaultMacro = getDefaultMacroForSub(subId);
  const next = {
    subcategoryMacro: { ...overrides.subcategoryMacro },
    productAssignments: { ...overrides.productAssignments },
  };

  if (defaultMacro === targetMacroId) {
    delete next.subcategoryMacro[subId];
  } else {
    next.subcategoryMacro[subId] = targetMacroId;
  }

  return next;
}

export function assignProduct(
  overrides: TaxonomyOverrides,
  site: string,
  productUrl: string,
  macroId: string,
  subId: string,
): TaxonomyOverrides {
  const key = productOverrideKey(site, productUrl);
  const base = { macroId, subId };
  const next = {
    subcategoryMacro: { ...overrides.subcategoryMacro },
    productAssignments: { ...overrides.productAssignments, [key]: base },
  };
  return next;
}

export function clearProductAssignment(
  overrides: TaxonomyOverrides,
  site: string,
  productUrl: string,
): TaxonomyOverrides {
  const key = productOverrideKey(site, productUrl);
  const next = {
    subcategoryMacro: { ...overrides.subcategoryMacro },
    productAssignments: { ...overrides.productAssignments },
  };
  delete next.productAssignments[key];
  return next;
}

export function resetAllOverrides(): TaxonomyOverrides {
  saveOverrides(EMPTY_OVERRIDES);
  return { ...EMPTY_OVERRIDES };
}

export function countOverrides(overrides: TaxonomyOverrides): number {
  return (
    Object.keys(overrides.subcategoryMacro).length + Object.keys(overrides.productAssignments).length
  );
}

/** Sous-catégories affichées sous une macro (y compris déplacements) */
export function subcategoriesForMacro(macroId: string, overrides: TaxonomyOverrides): string[] {
  const ids = new Set<string>();
  for (const macro of TAXONOMY) {
    for (const sub of macro.subcategories) {
      if (getEffectiveMacroForSub(sub.id, overrides) === macroId) {
        ids.add(sub.id);
      }
    }
  }
  return [...ids];
}
