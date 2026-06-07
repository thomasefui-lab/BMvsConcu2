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

/** Taxonomie commune — 8 univers, sous-catégories masquées si vides par site */
export const TAXONOMY: MacroCategoryDef[] = [
  {
    id: "salon",
    label: "Salon",
    categoryKeywords: ["canape", "canapé", "fauteuil", "assise", "salon", "pouf", "méridienne", "meridienne"],
    subcategories: [
      { id: "canape", label: "Canapés", keywords: ["canapé", "canape", "canape-lit", "angle", "convertible", "modulable", "panoramique", "clic-clac"] },
      { id: "fauteuil", label: "Fauteuils & chauffeuses", keywords: ["fauteuil", "chauffeuse", "repose-pied", "repose pied", "suspendu", "rocking"] },
      { id: "pouf", label: "Poufs & méridienes", keywords: ["pouf", "ottoman", "méridienne", "meridienne", "banquette"] },
      { id: "table_basse", label: "Tables basses", keywords: ["table basse", "table-basse", "table d'appoint", "table d appoint"] },
      { id: "meuble_tv", label: "Meubles TV", keywords: ["meuble tv", "buffet tv", "porte tv", "meuble hifi", "meuble television"] },
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
      "bureau",
      "buanderie",
    ],
    subcategories: [
      { id: "table_manger", label: "Tables à manger", keywords: ["table à manger", "table a manger", "table haute", "table extensible", "table ronde", "table rectangulaire"] },
      { id: "chaises", label: "Chaises & tabourets", keywords: ["chaise", "tabouret", "banc ", "banc-"] },
      { id: "buffet", label: "Buffets & bahuts", keywords: ["buffet", "bahut", "vaisselier", "enfilade", "credenza"] },
      { id: "commode", label: "Commodes & consoles", keywords: ["commode", "console", "chiffonnier", "meuble d'appoint"] },
      { id: "bibliotheque", label: "Bibliothèques & étagères", keywords: ["bibliothèque", "bibliotheque", "étagère", "etagere", "etagere", "rangement ouvert"] },
      { id: "bureau", label: "Bureaux", keywords: ["bureau", "chaise de bureau", "fauteuil de bureau", "secrétaire", "secretaire"] },
      { id: "autres_sejour", label: "Autres meubles", keywords: ["meuble", "ensemble de meubles", "vitrine", "armoire vitrine"] },
    ],
  },
  {
    id: "exterieur",
    label: "Extérieur",
    categoryKeywords: ["jardin", "terrasse", "extérieur", "exterieur", "outdoor", "plein air"],
    subcategories: [
      {
        id: "mobilier_jardin",
        label: "Mobilier de jardin",
        keywords: [
          "salon de jardin",
          "salon bas",
          "mobilier de jardin",
          "canapé de jardin",
          "canape de jardin",
          "chaise de jardin",
          "table de jardin",
          "fauteuil de jardin",
          "modular garden",
          "resine tressee",
          "résine tressée",
          "textilene",
          "acacia",
          "teck",
        ],
      },
      { id: "pergola", label: "Pergolas & tonnelles", keywords: ["pergola", "tonnelle", "abri de jardin", "abri jardin", "bioclimatique", "gazebo"] },
      { id: "barbecue", label: "Barbecues & planchas", keywords: ["barbecue", "plancha", "brasero", "barbecue"] },
      { id: "parasol", label: "Parasols & voiles", keywords: ["parasol", "voile d'ombrage", "voile dombrage", "store banne", "pare-soleil"] },
      { id: "transat", label: "Transats & bains de soleil", keywords: ["transat", "bain de soleil", "hamac", "sunlounger", "chaise longue"] },
      { id: "jardin_enfant", label: "Jardin enfant", keywords: ["jardin enfant", "mobilier jardin enfant", "banc de jardin enfant"] },
      { id: "autres_exterieur", label: "Autres extérieur", keywords: ["jardin", "terrasse", "outdoor", "pot ", "jardinière", "jardiniere", "outil de jardin", "rateau"] },
    ],
  },
  {
    id: "chambre",
    label: "Chambre",
    categoryKeywords: ["chambre", "literie", "lit", "matelas", "armoire", "sommier"],
    subcategories: [
      { id: "chambre_enfant", label: "Chambre enfant", keywords: ["chambre enfant", "chambre complete enfant", "lit enfant", "lit bébé", "lit bebe", "lit junior", "lit cabane", "armoire enfant", "commode enfant", "bureau enfant", "kids", "junior"] },
      { id: "lit", label: "Lits", keywords: ["lit ", "lit-", "lit double", "lit simple", "lit king", "lit queen", "lit 140", "lit 160", "lit 180", "lit 90"] },
      { id: "lit_coffre", label: "Lits coffre", keywords: ["lit coffre", "lit avec rangement", "lit rangement", "lit box"] },
      { id: "matelas", label: "Matelas & sommiers", keywords: ["matelas", "surmatelas", "sommier", "sommier tapissier"] },
      { id: "armoire", label: "Armoires & dressing", keywords: ["armoire", "dressing", "penderie", "porte-manteau"] },
      { id: "autres_chambre", label: "Tables de chevet & rangements", keywords: ["table de chevet", "chevet", "linge de lit", "tête de lit", "tete de lit", "parure"] },
    ],
  },
  {
    id: "cuisine",
    label: "Cuisine",
    categoryKeywords: ["cuisine", "kitchen"],
    subcategories: [
      { id: "meuble_cuisine", label: "Meubles cuisine", keywords: ["meuble cuisine", "meuble de cuisine", "buffet cuisine", "ilot", "îlot", "plan de travail"] },
      { id: "table_chaise_cuisine", label: "Tables & chaises cuisine", keywords: ["table cuisine", "chaise cuisine", "tabouret cuisine", "bar ", "comptoir"] },
      { id: "rangement_cuisine", label: "Rangements cuisine", keywords: ["rangement cuisine", "etagere cuisine", "étagère cuisine", "placard cuisine"] },
    ],
  },
  {
    id: "entree",
    label: "Entrée",
    categoryKeywords: ["entree", "entrée", "hall", "vestiaire", "buanderie", "garage"],
    subcategories: [
      { id: "meuble_entree", label: "Meubles d'entrée", keywords: ["meuble d'entree", "meuble d entree", "meuble entree", "porte-manteau", "porte manteau", "patere", "patère"] },
      { id: "console_banc", label: "Consoles & bancs", keywords: ["console d'entree", "console entree", "banc d'entree", "banc entree", "banc bout de lit"] },
      { id: "rangement_entree", label: "Rangements & buanderie", keywords: ["buanderie", "garage", "rangement garage", "casier", "meuble a chaussures", "meuble chaussures", "shoe"] },
    ],
  },
  {
    id: "salle_de_bain",
    label: "Salle de bain",
    categoryKeywords: ["salle de bain", "salle-de-bain", "bathroom"],
    subcategories: [
      { id: "meuble_sdb", label: "Meubles salle de bain", keywords: ["meuble salle de bain", "meuble de salle de bain", "vasque", "lavabo", "miroir salle de bain"] },
      { id: "colonne_sdb", label: "Colonnes & rangements", keywords: ["colonne salle de bain", "colonne de rangement", "armoire salle de bain", "etagere salle de bain"] },
    ],
  },
  {
    id: "deco",
    label: "Luminaire & Déco",
    categoryKeywords: ["déco", "deco", "décoration", "decoration", "tapis", "luminaire", "linge", "accessoire"],
    subcategories: [
      { id: "tapis", label: "Tapis", keywords: ["tapis", "paillasson", "carpet"] },
      { id: "coussin", label: "Coussins & plaids", keywords: ["coussin", "housse de coussin", "plaid", "throw", "jeté", "jete"] },
      { id: "luminaire", label: "Luminaires", keywords: ["lampe", "luminaire", "suspension", "applique", "éclairage", "eclairage", "lampadaire", "abat-jour", "abat jour", "spot "] },
      { id: "linge", label: "Linge de maison", keywords: ["linge de maison", "linge de lit", "housse de couette", "rideau", "serviette", "torchon"] },
      { id: "animaux", label: "Animaux", keywords: ["chien", "chat", "niche", "panier animal", "griffoir", "litiere", "litière"] },
      { id: "autres_deco", label: "Décoration & accessoires", keywords: ["miroir", "vase", "cadre", "bougie", "photophore", "déco", "deco", "decoration", "décoration", "echelle decorative"] },
    ],
  },
];

/** Règles URL (prioritaires) — chemin produit ou catégorie */
const URL_RULES: { macro: string; sub: string; patterns: string[] }[] = [
  { macro: "exterieur", sub: "pergola", patterns: ["/pergola", "pergola-", "-pergola"] },
  { macro: "exterieur", sub: "barbecue", patterns: ["/barbecue", "/plancha", "/brasero"] },
  { macro: "exterieur", sub: "parasol", patterns: ["/parasol", "/voile", "pare-soleil"] },
  { macro: "exterieur", sub: "transat", patterns: ["/transat", "/hamac", "bain-de-soleil", "bains-de-soleil"] },
  {
    macro: "exterieur",
    sub: "mobilier_jardin",
    patterns: [
      "/jardin",
      "mobilier-de-jardin",
      "chaise-de-jardin",
      "table-de-jardin",
      "salon-de-jardin",
      "fauteuil-de-jardin",
      "canape-de-jardin",
      "terrasse-jardin",
      "/terrasse",
      "rangement-jardin",
      "/c/jardin",
    ],
  },
  { macro: "exterieur", sub: "jardin_enfant", patterns: ["jardin-enfant", "mobilier-jardin-enfant"] },
  { macro: "chambre", sub: "chambre_enfant", patterns: ["/enfant", "chambre-enfant", "chambre-complete-enfant", "armoire-pour-enfant", "lit-enfant"] },
  { macro: "cuisine", sub: "meuble_cuisine", patterns: ["/cuisine", "meuble-cuisine"] },
  { macro: "entree", sub: "meuble_entree", patterns: ["/entree", "meuble-d-entree", "meuble-entree"] },
  { macro: "entree", sub: "rangement_entree", patterns: ["/buanderie", "/garage", "rangement-garage"] },
  { macro: "salle_de_bain", sub: "meuble_sdb", patterns: ["/salle-de-bain", "salle-de-bain", "meuble-salle-de-bain"] },
  { macro: "salon", sub: "canape", patterns: ["/canape", "/canape-lit", "/canapes", "canape-c"] },
  { macro: "salon", sub: "fauteuil", patterns: ["/fauteuil", "/chaise-suspendue"] },
  { macro: "sejour", sub: "bibliotheque", patterns: ["/bibliotheque", "/etagere", "/etageres"] },
  { macro: "sejour", sub: "bureau", patterns: ["/bureau", "chaise-de-bureau", "/meuble-bureau"] },
  { macro: "sejour", sub: "buffet", patterns: ["/buffet", "/bahut", "/vaisselier"] },
  { macro: "sejour", sub: "table_manger", patterns: ["/table-a-manger", "table-manger", "/salle-a-manger", "meuble-salle-a-manger"] },
  { macro: "sejour", sub: "chaises", patterns: ["/chaise", "/chaises", "/tabouret", "/banquette"] },
  { macro: "chambre", sub: "lit", patterns: ["/lit", "-lit-", "/lits"] },
  { macro: "chambre", sub: "armoire", patterns: ["/armoire", "/dressing", "/penderie"] },
  { macro: "chambre", sub: "matelas", patterns: ["/matelas", "/sommier"] },
  { macro: "deco", sub: "tapis", patterns: ["/tapis", "-tapis-"] },
  { macro: "deco", sub: "coussin", patterns: ["/coussin", "/plaids", "/plaid"] },
  { macro: "deco", sub: "luminaire", patterns: ["/luminaire", "/applique", "/suspension", "/lampadaire", "/lampe"] },
  { macro: "deco", sub: "animaux", patterns: ["/animal", "/chien", "/chat", "/niche"] },
];

/** Catégorie scrapée → macro (sous-catégorie déduite par mots-clés / URL) */
const SITE_CATEGORY_MAP: Record<string, { macro: string }> = {
  canapes: { macro: "salon" },
  "canape et fauteuil": { macro: "salon" },
  "canapes et fauteuils": { macro: "salon" },
  jardin: { macro: "exterieur" },
  "le jardin": { macro: "exterieur" },
  "terrasse, jardin": { macro: "exterieur" },
  "mobilier jardin enfant": { macro: "exterieur" },
  "meubles de sejour": { macro: "sejour" },
  sejour: { macro: "sejour" },
  "salle a manger": { macro: "sejour" },
  "salle à manger": { macro: "sejour" },
  "chambre et literie": { macro: "chambre" },
  chambre: { macro: "chambre" },
  "chambre enfant": { macro: "chambre" },
  lit: { macro: "chambre" },
  "chaise et tabouret": { macro: "sejour" },
  meuble: { macro: "sejour" },
  meubles: { macro: "sejour" },
  "ensemble de meubles": { macro: "sejour" },
  "tapis et decoration": { macro: "deco" },
  decoration: { macro: "deco" },
  "décoration": { macro: "deco" },
  deco: { macro: "deco" },
  luminaires: { macro: "deco" },
  tapis: { macro: "deco" },
  "a table": { macro: "sejour" },
  "linge de maison": { macro: "deco" },
  "mobilier d'interieur": { macro: "salon" },
  salon: { macro: "salon" },
  cuisine: { macro: "cuisine" },
  entree: { macro: "entree" },
  "entrée": { macro: "entree" },
  bureau: { macro: "sejour" },
  buanderie: { macro: "entree" },
  "salle de bain": { macro: "salle_de_bain" },
};

/** Collections / gammes outdoor connues (bestmobilier, bobochic…) */
const OUTDOOR_COLLECTION_HINTS = [
  "yulara",
  "fira",
  "konna",
  "sashi",
  "beyla",
  "isadora",
  "marbella",
  "papeete",
  "salome",
  "zambra",
  "riviera",
  "cozumel",
  "cherry",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesKeyword(text: string, keyword: string): boolean {
  const n = normalize(text);
  const k = normalize(keyword);
  if (!k) return false;
  if (k.endsWith(" ")) return n.includes(k);
  return n.includes(k);
}

function matchUrlRules(url: string): { macroId: string; subId: string } | null {
  const n = normalize(url);
  for (const rule of URL_RULES) {
    if (rule.patterns.some((p) => n.includes(normalize(p)))) {
      return { macroId: rule.macro, subId: rule.sub };
    }
  }
  return null;
}

function isOutdoorProduct(combined: string, collection: string | null): boolean {
  const outdoorSignals = [
    "jardin",
    "terrasse",
    "outdoor",
    "salon de jardin",
    "salon bas",
    "canape de jardin",
    "canapé de jardin",
    "mobilier de jardin",
    "chaise de jardin",
    "fauteuil de jardin",
    "pergola",
    "parasol",
    "hamac",
    "transat",
    "bain de soleil",
    "resine tressee",
    "résine tressée",
    "textilene",
  ];
  if (outdoorSignals.some((kw) => matchesKeyword(combined, kw))) return true;
  if (collection) {
    const c = normalize(collection);
    if (OUTDOOR_COLLECTION_HINTS.some((h) => c.includes(h))) return true;
  }
  const namePart = combined.split(" ").slice(0, 3).join(" ");
  if (OUTDOOR_COLLECTION_HINTS.some((h) => matchesKeyword(namePart, h))) {
    if (matchesKeyword(combined, "jardin") || matchesKeyword(combined, "terrasse") || matchesKeyword(combined, "outdoor")) {
      return true;
    }
  }
  return false;
}

function classifyOutdoor(combined: string): { macroId: string; subId: string } {
  const exterieur = TAXONOMY.find((m) => m.id === "exterieur");
  if (!exterieur) return { macroId: "exterieur", subId: "mobilier_jardin" };

  for (const sub of exterieur.subcategories) {
    if (sub.keywords.some((kw) => matchesKeyword(combined, kw))) {
      return { macroId: "exterieur", subId: sub.id };
    }
  }
  return { macroId: "exterieur", subId: "mobilier_jardin" };
}

function matchSubcategoryKeywords(combined: string, macroIds?: string[]): { macroId: string; subId: string } | null {
  const macros = macroIds
    ? TAXONOMY.filter((m) => macroIds.includes(m.id))
    : TAXONOMY;

  for (const macro of macros) {
    for (const sub of macro.subcategories) {
      if (sub.keywords.some((kw) => matchesKeyword(combined, kw))) {
        return { macroId: macro.id, subId: sub.id };
      }
    }
  }
  return null;
}

function fallbackSubForMacro(macroId: string): string {
  const macro = TAXONOMY.find((m) => m.id === macroId);
  return macro?.subcategories[macro.subcategories.length - 1]?.id ?? "autres_deco";
}

export function classifyProduct(product: ProductRow): { macroId: string; subId: string } {
  const catNorm = normalize(product.category_name);
  const nameNorm = normalize(cleanProductName(product.product_name));
  const urlNorm = normalize(product.product_url);
  const collectionNorm = product.collection_name ? normalize(product.collection_name) : "";
  const combined = `${catNorm} ${nameNorm} ${urlNorm} ${collectionNorm}`;

  // 1. Extérieur prioritaire (ex. canapés de jardin classés en « Canapes »)
  if (isOutdoorProduct(combined, product.collection_name)) {
    return classifyOutdoor(combined);
  }

  // 2. Règles URL produit / catégorie
  const urlMatch = matchUrlRules(product.product_url) ?? matchUrlRules(product.category_url);
  if (urlMatch) {
    return urlMatch;
  }

  // 3. Mots-clés sous-catégories (ordre taxonomie : chambre enfant avant lit, etc.)
  const keywordMatch = matchSubcategoryKeywords(combined);
  if (keywordMatch) {
    return keywordMatch;
  }

  // 4. Catégorie scrapée du site → macro, puis affinage par nom
  const siteHint = SITE_CATEGORY_MAP[catNorm];
  if (siteHint) {
    const refined = matchSubcategoryKeywords(nameNorm, [siteHint.macro]);
    if (refined) return refined;
    return { macroId: siteHint.macro, subId: fallbackSubForMacro(siteHint.macro) };
  }

  // 5. Mots-clés macro sur le nom de catégorie
  for (const macro of TAXONOMY) {
    if (macro.categoryKeywords.some((kw) => matchesKeyword(catNorm, kw))) {
      const refined = matchSubcategoryKeywords(nameNorm, [macro.id]);
      if (refined) return refined;
      return { macroId: macro.id, subId: fallbackSubForMacro(macro.id) };
    }
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
