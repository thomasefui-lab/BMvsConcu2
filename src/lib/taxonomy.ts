import type { ProductRow } from "./types";

export interface SubCategoryDef {
  id: string;
  label: string;
  keywords: string[];
}

export interface MacroCategoryDef {
  id: string;
  label: string;
  subcategories: SubCategoryDef[];
  categoryKeywords: string[];
}

/** Taxonomie commune à tous les concurrents */
export const TAXONOMY: MacroCategoryDef[] = [
  {
    id: "salon",
    label: "Salon",
    categoryKeywords: [
      "canape",
      "canapé",
      "fauteuil",
      "assise",
      "salon",
      "pouf",
      "méridienne",
      "meridienne",
    ],
    subcategories: [
      { id: "canape", label: "Canapés", keywords: ["canapé", "canape", "angle", "convertible", "modulable"] },
      { id: "fauteuil", label: "Fauteuils", keywords: ["fauteuil", "repose-pied", "repose pied", "suspendu"] },
      { id: "pouf", label: "Poufs", keywords: ["pouf", "ottoman", "méridienne", "meridienne"] },
      { id: "table_basse", label: "Tables basses", keywords: ["table basse"] },
      { id: "meuble_tv", label: "Meubles TV", keywords: ["meuble tv", "buffet tv", "porte tv", "meuble hifi"] },
    ],
  },
  {
    id: "sejour",
    label: "Séjour",
    categoryKeywords: [
      "sejour",
      "séjour",
      "salle a manger",
      "salle à manger",
      "a table",
      "chaise",
      "tabouret",
      "buffet",
      "commode",
      "meuble",
    ],
    subcategories: [
      { id: "table_manger", label: "Tables à manger", keywords: ["table à manger", "table a manger", "table haute", "table extensible"] },
      { id: "chaises", label: "Chaises & tabourets", keywords: ["chaise", "tabouret", "banc"] },
      { id: "buffet", label: "Buffets & bahuts", keywords: ["buffet", "bahut", "vaisselier", "enfilade"] },
      { id: "commode", label: "Commodes & consoles", keywords: ["commode", "console", "chiffonnier"] },
      { id: "autres_sejour", label: "Autres meubles", keywords: ["étagère", "etagere", "bibliothèque", "bibliotheque", "meuble"] },
    ],
  },
  {
    id: "chambre",
    label: "Chambre",
    categoryKeywords: ["chambre", "literie", "lit", "matelas", "armoire"],
    subcategories: [
      { id: "lit", label: "Lits", keywords: ["lit ", "lit-", "lit double", "lit simple", "lit king", "lit queen"] },
      { id: "lit_coffre", label: "Lits coffre", keywords: ["lit coffre", "lit avec rangement", "lit rangement"] },
      { id: "matelas", label: "Matelas", keywords: ["matelas", "surmatelas"] },
      { id: "armoire", label: "Armoires & dressing", keywords: ["armoire", "dressing", "penderie"] },
      { id: "autres_chambre", label: "Autres chambre", keywords: ["table de chevet", "chevet", "linge de lit"] },
    ],
  },
  {
    id: "exterieur",
    label: "Extérieur",
    categoryKeywords: ["jardin", "terrasse", "extérieur", "exterieur", "outdoor"],
    subcategories: [
      { id: "mobilier_jardin", label: "Mobilier de jardin", keywords: ["salon de jardin", "jardin", "transat", "chaise de jardin", "table de jardin"] },
      { id: "pergola", label: "Pergolas & tonnelles", keywords: ["pergola", "tonnelle", "abri"] },
      { id: "barbecue", label: "Barbecues & cuisine", keywords: ["barbecue", "plancha", "brasero"] },
      { id: "parasol", label: "Parasols & voiles", keywords: ["parasol", "voile d'ombrage", "voile"] },
      { id: "autres_exterieur", label: "Autres extérieur", keywords: ["bain de soleil", "hamac", "pot", "jardinière"] },
    ],
  },
  {
    id: "enfant",
    label: "Enfant",
    categoryKeywords: ["enfant", "kids", "bébé", "bebe", "junior"],
    subcategories: [
      { id: "lit_enfant", label: "Lits enfant", keywords: ["lit enfant", "lit bébé", "lit bebe", "lit junior", "lit cabane"] },
      { id: "bureau_enfant", label: "Bureaux & rangements", keywords: ["bureau enfant", "commode enfant", "armoire enfant", "étagère enfant"] },
      { id: "autres_enfant", label: "Autres enfant", keywords: ["chambre enfant", "kids"] },
    ],
  },
  {
    id: "animaux",
    label: "Animaux",
    categoryKeywords: ["animal", "chien", "chat"],
    subcategories: [
      { id: "mobilier_animal", label: "Mobilier pour animaux", keywords: ["chien", "chat", "niche", "panier", "griffoir", "animal"] },
    ],
  },
  {
    id: "deco",
    label: "Luminaire & Déco",
    categoryKeywords: ["déco", "deco", "décoration", "decoration", "tapis", "luminaire", "linge"],
    subcategories: [
      { id: "tapis", label: "Tapis", keywords: ["tapis"] },
      { id: "coussin", label: "Coussins", keywords: ["coussin", "housse de coussin"] },
      { id: "plaid", label: "Plaids & throws", keywords: ["plaid", "throw", "jeté"] },
      { id: "luminaire", label: "Luminaires", keywords: ["lampe", "luminaire", "suspension", "applique", "éclairage", "eclairage"] },
      { id: "autres_deco", label: "Autres déco", keywords: ["miroir", "vase", "cadre", "bougie", "déco", "deco", "linge"] },
    ],
  },
];

const SITE_CATEGORY_MAP: Record<string, { macro: string; sub?: string }> = {
  canapes: { macro: "salon", sub: "canape" },
  "canape et fauteuil": { macro: "salon" },
  "canapes et fauteuils": { macro: "salon" },
  jardin: { macro: "exterieur" },
  "le jardin": { macro: "exterieur" },
  "terrasse, jardin": { macro: "exterieur" },
  "meubles de sejour": { macro: "sejour" },
  sejour: { macro: "sejour" },
  "chambre et literie": { macro: "chambre" },
  lit: { macro: "chambre", sub: "lit" },
  "chaise et tabouret": { macro: "sejour", sub: "chaises" },
  meuble: { macro: "sejour", sub: "autres_sejour" },
  meubles: { macro: "sejour", sub: "autres_sejour" },
  enfant: { macro: "enfant" },
  kids: { macro: "enfant" },
  "tapis et decoration": { macro: "deco" },
  decoration: { macro: "deco" },
  luminaires: { macro: "deco", sub: "luminaire" },
  "a table": { macro: "sejour", sub: "table_manger" },
  "linge de maison": { macro: "deco", sub: "autres_deco" },
  "mobilier d'interieur": { macro: "salon" },
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesKeyword(text: string, keyword: string): boolean {
  const n = normalize(text);
  const k = normalize(keyword);
  return n.includes(k);
}

export function classifyProduct(product: ProductRow): { macroId: string; subId: string } {
  const catNorm = normalize(product.category_name);
  const nameNorm = normalize(cleanProductName(product.product_name));
  const combined = `${catNorm} ${nameNorm}`;

  const siteHint = SITE_CATEGORY_MAP[catNorm];
  if (siteHint?.sub) {
    return { macroId: siteHint.macro, subId: siteHint.sub };
  }

  for (const macro of TAXONOMY) {
    for (const sub of macro.subcategories) {
      if (sub.keywords.some((kw) => matchesKeyword(combined, kw))) {
        return { macroId: macro.id, subId: sub.id };
      }
    }
    if (macro.categoryKeywords.some((kw) => matchesKeyword(catNorm, kw))) {
      const fallbackSub = macro.subcategories[macro.subcategories.length - 1];
      return { macroId: macro.id, subId: fallbackSub.id };
    }
  }

  if (siteHint) {
    const macro = TAXONOMY.find((m) => m.id === siteHint.macro);
    const sub = macro?.subcategories[0];
    return { macroId: siteHint.macro, subId: sub?.id ?? "autres" };
  }

  return { macroId: "deco", subId: "autres_deco" };
}

export function cleanProductName(name: string): string {
  return name
    .replace(/^\d+(\.\d+)?\s*\/\s*5\s*-\s*\d+\s*avis\s*/i, "")
    .replace(/^(nouveauté|nouveau|promo|flash)\s*[-–]?\s*/gi, "")
    .replace(/\s*[-–]\s*\d+%\s*/g, " ")
    .trim();
}
