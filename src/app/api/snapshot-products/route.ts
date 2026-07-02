import { NextResponse } from "next/server";
import { getProductsAtScrapeDay } from "@/lib/data";
import type { SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_SITES = new Set<string>(COMPETITORS.map((c) => c.id));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const site = searchParams.get("site");
  const day = searchParams.get("day");

  if (!site || !VALID_SITES.has(site)) {
    return NextResponse.json({ error: "Paramètre 'site' requis." }, { status: 400 });
  }
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: "Paramètre 'day' requis (YYYY-MM-DD)." }, { status: 400 });
  }

  const products = await getProductsAtScrapeDay(site as SiteId, day);
  return NextResponse.json({ site, day, products });
}
