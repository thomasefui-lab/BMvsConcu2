import { NextResponse } from "next/server";
import { getScrapeDays } from "@/lib/data";
import type { SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_SITES = new Set<string>(COMPETITORS.map((c) => c.id));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const site = searchParams.get("site");

  let days = await getScrapeDays();
  if (site && VALID_SITES.has(site)) {
    days = days.filter((d) => d.site === (site as SiteId));
  }

  return NextResponse.json({ days });
}
