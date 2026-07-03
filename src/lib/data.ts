import { readFileSync, existsSync } from "fs";
import path from "path";
import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "./supabase";
import { fetchAllRows } from "./supabase-fetch";
import type {
  DashboardData,
  ProductRow,
  ReviewGrowthRow,
  ScrapeDay,
  SiteId,
} from "./types";
import { aggregatePriceByDay, aggregatePriceBySiteAndDay, type RawPriceObservation } from "./price-analytics";

const DEMO_PATH = path.join(process.cwd(), "public", "demo-data.json");

const SITES: SiteId[] = ["bestmobilier", "bobochic", "sweeek", "baita", "habitat"];

const PRODUCT_COLUMNS =
  "site,category_name,category_url,product_url,product_name,collection_name,price_cents,price_text,review_count,badges,position,scraped_at,image_url,first_review_count,first_scraped_at";

const SNAPSHOT_COLUMNS =
  "site,category_name,category_url,product_url,product_name,collection_name,price_cents,price_text,review_count,badges,position,scraped_at";

function parseProductRow(row: Record<string, unknown>): ProductRow {
  return {
    site: row.site as SiteId,
    category_name: String(row.category_name ?? ""),
    category_url: String(row.category_url ?? ""),
    product_url: String(row.product_url ?? ""),
    product_name: String(row.product_name ?? ""),
    collection_name: row.collection_name ? String(row.collection_name) : null,
    price_cents: row.price_cents != null && row.price_cents !== "" ? Number(row.price_cents) : null,
    price_text: row.price_text ? String(row.price_text) : null,
    review_count:
      row.review_count != null && row.review_count !== "" ? Number(row.review_count) : null,
    badges: row.badges ? String(row.badges) : null,
    position: row.position != null && row.position !== "" ? Number(row.position) : null,
    scraped_at: String(row.scraped_at ?? new Date().toISOString()),
    image_url: row.image_url ? String(row.image_url) : null,
    first_review_count:
      row.first_review_count != null && row.first_review_count !== ""
        ? Number(row.first_review_count)
        : null,
    first_scraped_at: row.first_scraped_at ? String(row.first_scraped_at) : null,
  };
}

async function fetchDashboardProducts(client: NonNullable<ReturnType<typeof createSupabaseServerClient>>) {
  // Vue dashboard_products (1 ligne / produit) — fallback sur latest_product_snapshots
  for (const view of ["dashboard_products", "latest_product_snapshots"] as const) {
    try {
      const columns =
        view === "dashboard_products"
          ? PRODUCT_COLUMNS
          : SNAPSHOT_COLUMNS;
      const rows = await fetchAllRows<Record<string, unknown>>(async (from, to) => {
        const { data, error } = await client
          .from(view)
          .select(columns)
          .in("site", SITES)
          .order("site", { ascending: true })
          .order("product_url", { ascending: true })
          .range(from, to);
        return {
          data: (data ?? null) as Record<string, unknown>[] | null,
          error: error ? { message: error.message } : null,
        };
      });
      if (rows.length > 0) {
        return rows.map(parseProductRow);
      }
    } catch {
      continue;
    }
  }
  return [];
}

async function fetchFromSupabase(): Promise<DashboardData | null> {
  const client = createSupabaseServerClient();
  if (!client) return null;

  try {
    const products = await fetchDashboardProducts(client);
    if (products.length === 0) return null;

    return {
      products,
      events: [],
      fetchedAt: new Date().toISOString(),
      source: "supabase",
    };
  } catch (error) {
    console.error("Supabase fetch error:", error);
    return null;
  }
}

const getCachedSupabaseDashboard = unstable_cache(
  fetchFromSupabase,
  ["dashboard-data"],
  { revalidate: 120 },
);

const getCachedScrapeDays = unstable_cache(
  async () => {
    const client = createSupabaseServerClient();
    if (!client) return [] as ScrapeDay[];
    try {
      const rows = await fetchAllRows<Record<string, unknown>>(async (from, to) => {
        const { data, error } = await client
          .from("scrape_days")
          .select("site,scrape_day,first_scraped_at,last_scraped_at,snapshot_count")
          .in("site", SITES)
          .order("site", { ascending: true })
          .order("scrape_day", { ascending: true })
          .range(from, to);
        return {
          data: (data ?? null) as Record<string, unknown>[] | null,
          error: error ? { message: error.message } : null,
        };
      });
      return rows.map(parseScrapeDay);
    } catch (error) {
      console.error("getScrapeDays error:", error);
      return [];
    }
  },
  ["scrape-days"],
  { revalidate: 300 },
);

function loadDemoData(): DashboardData | null {
  if (!existsSync(DEMO_PATH)) return null;
  const raw = JSON.parse(readFileSync(DEMO_PATH, "utf-8")) as {
    products: Record<string, unknown>[];
    events: Record<string, unknown>[];
  };
  return {
    products: raw.products.map(parseProductRow),
    events: [],
    fetchedAt: new Date().toISOString(),
    source: "demo",
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const fromSupabase = await getCachedSupabaseDashboard();
  if (fromSupabase) return fromSupabase;

  const demo = loadDemoData();
  if (demo) return demo;

  return {
    products: [],
    events: [],
    fetchedAt: new Date().toISOString(),
    source: "demo",
  };
}

function parseScrapeDay(row: Record<string, unknown>): ScrapeDay {
  return {
    site: row.site as SiteId,
    scrape_day: String(row.scrape_day ?? ""),
    first_scraped_at: String(row.first_scraped_at ?? ""),
    last_scraped_at: String(row.last_scraped_at ?? ""),
    snapshot_count: row.snapshot_count != null ? Number(row.snapshot_count) : 0,
  };
}

/** Jours de scrape disponibles (vue scrape_days). Vide en mode démo. */
export async function getScrapeDays(): Promise<ScrapeDay[]> {
  return getCachedScrapeDays();
}

function parseReviewGrowthRow(row: Record<string, unknown>): ReviewGrowthRow {
  return {
    site: row.site as SiteId,
    product_url: String(row.product_url ?? ""),
    product_name: String(row.product_name ?? ""),
    category_name: String(row.category_name ?? ""),
    collection_name: row.collection_name ? String(row.collection_name) : null,
    price_cents:
      row.price_cents != null && row.price_cents !== "" ? Number(row.price_cents) : null,
    price_text: row.price_text ? String(row.price_text) : null,
    image_url: row.image_url ? String(row.image_url) : null,
    start_reviews: row.start_reviews != null ? Number(row.start_reviews) : 0,
    end_reviews: row.end_reviews != null ? Number(row.end_reviews) : 0,
    review_growth: row.review_growth != null ? Number(row.review_growth) : 0,
    start_scraped_at: String(row.start_scraped_at ?? ""),
    end_scraped_at: String(row.end_scraped_at ?? ""),
  };
}

/**
 * Évolution d'avis bornée par période pour un site, via la RPC review_growth_between.
 * Renvoie les lignes brutes (par product_url) ; le regroupement parent se fait ensuite en JS.
 */
export async function getReviewGrowth(
  site: SiteId,
  from: string,
  to: string,
  candidateLimit = 200,
): Promise<ReviewGrowthRow[]> {
  const client = createSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client.rpc("review_growth_between", {
      p_site: site,
      p_from: from,
      p_to: to,
      p_limit: candidateLimit,
    });
    if (error) {
      console.error("review_growth_between error:", error.message);
      return [];
    }
    return ((data ?? []) as Record<string, unknown>[]).map(parseReviewGrowthRow);
  } catch (error) {
    console.error("getReviewGrowth error:", error);
    return [];
  }
}

function latestRowsByUrl(rows: ProductRow[]): ProductRow[] {
  const map = new Map<string, ProductRow>();
  for (const row of rows) {
    const key = `${row.site}|${row.product_url}`;
    const existing = map.get(key);
    if (!existing || row.scraped_at > existing.scraped_at) {
      map.set(key, row);
    }
  }
  return [...map.values()];
}

/** Catalogue tel qu'il existait à une date de scrape (1 snapshot / URL ce jour-là). */
export async function getProductsAtScrapeDay(site: SiteId, scrapeDay: string): Promise<ProductRow[]> {
  const client = createSupabaseServerClient();
  if (!client) return [];

  const dayStart = `${scrapeDay}T00:00:00.000Z`;
  const dayEnd = `${scrapeDay}T23:59:59.999Z`;

  try {
    const rows = await fetchAllRows<Record<string, unknown>>(async (from, to) => {
      const { data, error } = await client
        .from("product_snapshots")
        .select(SNAPSHOT_COLUMNS)
        .eq("site", site)
        .gte("scraped_at", dayStart)
        .lte("scraped_at", dayEnd)
        .order("product_url", { ascending: true })
        .order("scraped_at", { ascending: false })
        .range(from, to);
      return {
        data: (data ?? null) as Record<string, unknown>[] | null,
        error: error ? { message: error.message } : null,
      };
    });
    return latestRowsByUrl(rows.map(parseProductRow));
  } catch (error) {
    console.error("getProductsAtScrapeDay error:", error);
    return [];
  }
}

/** Observations prix historiques pour construire une courbe d'évolution. */
export async function getPriceObservations(
  sites: SiteId[],
  productUrls?: string[],
): Promise<RawPriceObservation[]> {
  const client = createSupabaseServerClient();
  if (!client) return [];

  try {
    const rows = await fetchAllRows<Record<string, unknown>>(async (from, to) => {
      let query = client
        .from("product_snapshots")
        .select("site,product_url,price_cents,scraped_at")
        .in("site", sites)
        .not("price_cents", "is", null)
        .gt("price_cents", 0)
        .order("scraped_at", { ascending: true });

      if (productUrls?.length) {
        query = query.in("product_url", productUrls);
      }

      const { data, error } = await query.range(from, to);
      return {
        data: (data ?? null) as Record<string, unknown>[] | null,
        error: error ? { message: error.message } : null,
      };
    });

    return rows.map((row) => ({
      site: String(row.site),
      scrape_day: String(row.scraped_at ?? "").slice(0, 10),
      price_cents: Number(row.price_cents),
    }));
  } catch (error) {
    console.error("getPriceObservations error:", error);
    return [];
  }
}

export async function getPriceHistorySeries(sites: SiteId[], productUrls?: string[]) {
  const observations = await getPriceObservations(sites, productUrls);
  return {
    series: aggregatePriceByDay(observations),
    bySite: aggregatePriceBySiteAndDay(observations, sites) as Partial<Record<SiteId, ReturnType<typeof aggregatePriceByDay>>>,
  };
}
