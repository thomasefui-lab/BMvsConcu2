export const COMPETITORS = [
  { id: "bestmobilier", label: "Best Mobilier", isOwn: true },
  { id: "bobochic", label: "Bobochic", isOwn: false },
  { id: "sweeek", label: "Sweeek", isOwn: false },
  { id: "baita", label: "Baita", isOwn: false },
  { id: "habitat", label: "Habitat", isOwn: false },
] as const;

export type SiteId = (typeof COMPETITORS)[number]["id"];

export interface ProductRow {
  site: SiteId;
  category_name: string;
  category_url: string;
  product_url: string;
  product_name: string;
  collection_name: string | null;
  price_cents: number | null;
  price_text: string | null;
  review_count: number | null;
  badges: string | null;
  position: number | null;
  scraped_at: string;
  image_url?: string | null;
  /** Premier nombre d'avis connu (vue dashboard_products) */
  first_review_count?: number | null;
  /** Clé de regroupement parent (nom hors couleur + matière) */
  parent_key?: string;
  /** Nombre de déclinaisons couleur regroupées sous cette ligne */
  variant_count?: number;
}

export interface DailyEventRow {
  site: SiteId;
  event_type: string;
  category_name: string | null;
  product_url: string;
  product_name: string | null;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
}

export interface SubCategoryCount {
  id: string;
  label: string;
  count: number;
  collectionCount: number;
}

export interface MacroCategoryCount {
  id: string;
  label: string;
  count: number;
  collectionCount: number;
  percent: number;
  subcategories: SubCategoryCount[];
}

export interface ProductTreeData {
  site: SiteId;
  label: string;
  total: number;
  totalCollections: number;
  categories: MacroCategoryCount[];
}

export interface NoveltyMatrixCell {
  macroId: string;
  macroLabel: string;
  subId: string;
  subLabel: string;
  counts: Record<SiteId, number>;
}

export interface NoveltyProduct {
  site: SiteId;
  parent_key?: string;
  product_url: string;
  product_name: string;
  category_name: string;
  collection_name?: string | null;
  review_count: number;
  review_growth: number;
  price_text: string | null;
  image_url: string | null;
  detected_at: string;
}

export interface BestSellerProduct {
  site: SiteId;
  parent_key?: string;
  product_url: string;
  product_name: string;
  category_name: string;
  collection_name?: string | null;
  review_count: number;
  review_growth: number;
  price_text: string | null;
  image_url: string | null;
}

export interface DashboardData {
  products: ProductRow[];
  events: DailyEventRow[];
  fetchedAt: string;
  source: "supabase" | "demo";
}
