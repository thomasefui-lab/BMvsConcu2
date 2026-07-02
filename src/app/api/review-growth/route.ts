import { NextResponse } from "next/server";
import { aggregateReviewMovers } from "@/lib/analytics";
import { getReviewGrowth } from "@/lib/data";
import type { ReviewMoverProduct, SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_SITES = new Set<string>(COMPETITORS.map((c) => c.id));
const TOP_LIMIT = 25;
const CANDIDATE_LIMIT = 200;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const site = searchParams.get("site");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Paramètres 'from' et 'to' requis (ISO timestamptz)." },
      { status: 400 },
    );
  }
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
    return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json(
      { error: "La date de début doit précéder la date de fin." },
      { status: 400 },
    );
  }

  const sites: SiteId[] =
    site && VALID_SITES.has(site)
      ? [site as SiteId]
      : COMPETITORS.map((c) => c.id);

  const entries = await Promise.all(
    sites.map(async (s) => {
      const rows = await getReviewGrowth(s, from, to, CANDIDATE_LIMIT);
      return [s, aggregateReviewMovers(rows, TOP_LIMIT)] as const;
    }),
  );

  const bySite = Object.fromEntries(entries) as Record<SiteId, ReviewMoverProduct[]>;
  return NextResponse.json({ from, to, bySite });
}
