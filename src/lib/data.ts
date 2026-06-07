import { readFileSync, existsSync } from "fs";
import path from "path";
import { createSupabaseServerClient } from "./supabase";
import type { DailyEventRow, DashboardData, ProductRow, SiteId } from "./types";

const DEMO_PATH = path.join(process.cwd(), "public", "demo-data.json");

const SITES: SiteId[] = ["bestmobilier", "bobochic", "sweeek", "baita", "habitat"];

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
  };
}

function parseEventRow(row: Record<string, unknown>): DailyEventRow {
  return {
    site: row.site as SiteId,
    event_type: String(row.event_type ?? ""),
    category_name: row.category_name ? String(row.category_name) : null,
    product_url: String(row.product_url ?? ""),
    product_name: row.product_name ? String(row.product_name) : null,
    old_value: row.old_value ? String(row.old_value) : null,
    new_value: row.new_value ? String(row.new_value) : null,
    detected_at: String(row.detected_at ?? new Date().toISOString()),
  };
}

async function fetchFromSupabase(): Promise<DashboardData | null> {
  const client = createSupabaseServerClient();
  if (!client) return null;

  const [productsRes, eventsRes] = await Promise.all([
    client
      .from("product_snapshots")
      .select(
        "site,category_name,category_url,product_url,product_name,collection_name,price_cents,price_text,review_count,badges,position,scraped_at",
      )
      .in("site", SITES)
      .order("scraped_at", { ascending: false })
      .limit(50000),
    client
      .from("daily_events")
      .select("site,event_type,category_name,product_url,product_name,old_value,new_value,detected_at")
      .in("site", SITES)
      .order("detected_at", { ascending: false })
      .limit(20000),
  ]);

  if (productsRes.error) {
    console.error("Supabase products error:", productsRes.error.message);
    return null;
  }

  const products = (productsRes.data ?? []).map((row) => parseProductRow(row as Record<string, unknown>));
  const events = (eventsRes.error ? [] : eventsRes.data ?? []).map((row) =>
    parseEventRow(row as Record<string, unknown>),
  );

  if (products.length === 0) return null;

  return {
    products,
    events,
    fetchedAt: new Date().toISOString(),
    source: "supabase",
  };
}

function loadDemoData(): DashboardData | null {
  if (!existsSync(DEMO_PATH)) return null;
  const raw = JSON.parse(readFileSync(DEMO_PATH, "utf-8")) as {
    products: Record<string, unknown>[];
    events: Record<string, unknown>[];
  };
  return {
    products: raw.products.map(parseProductRow),
    events: raw.events.map(parseEventRow),
    fetchedAt: new Date().toISOString(),
    source: "demo",
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const fromSupabase = await fetchFromSupabase();
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
