import { NextResponse } from "next/server";
import { getPriceHistorySeries } from "@/lib/data";
import type { SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_SITES = new Set<string>(COMPETITORS.map((c) => c.id));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sitesParam = searchParams.get("sites");
  const productsParam = searchParams.get("products");

  const sites = (sitesParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SiteId => VALID_SITES.has(s));

  if (!sites.length) {
    return NextResponse.json({ error: "Paramètre 'sites' requis." }, { status: 400 });
  }

  const productUrls = productsParam
    ? productsParam.split(",").map((u) => u.trim()).filter(Boolean)
    : undefined;

  const series = await getPriceHistorySeries(sites, productUrls);
  return NextResponse.json({ sites, productUrls: productUrls ?? null, series });
}
