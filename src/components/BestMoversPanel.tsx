"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReviewMoverProduct, ScrapeDay, SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";
import { formatOfferUpdateDateShort } from "@/lib/dates";
import { ProductCard } from "./ProductCard";
import { MoverSiteSkeleton } from "./ui/PanelSkeleton";

type MoversBySite = Partial<Record<SiteId, ReviewMoverProduct[]>>;

function uniqueSortedDays(scrapeDays: ScrapeDay[]): string[] {
  return [...new Set(scrapeDays.map((d) => d.scrape_day).filter(Boolean))].sort();
}

function endOfDayIso(day: string): string {
  return `${day}T23:59:59.999Z`;
}

function startOfDayIso(day: string): string {
  return `${day}T00:00:00.000Z`;
}

export function BestMoversPanel() {
  const [selectedSite, setSelectedSite] = useState<SiteId>("bestmobilier");
  const [scrapeDays, setScrapeDays] = useState<ScrapeDay[]>([]);
  const [daysLoading, setDaysLoading] = useState(true);
  const [daysError, setDaysError] = useState<string | null>(null);

  const days = useMemo(() => uniqueSortedDays(scrapeDays), [scrapeDays]);
  const hasData = days.length >= 2;

  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [bySite, setBySite] = useState<MoversBySite>({});
  const [loadingSites, setLoadingSites] = useState<Partial<Record<SiteId, boolean>>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDaysLoading(true);
      setDaysError(null);
      try {
        const res = await fetch("/api/scrape-days");
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const body = (await res.json()) as { days: ScrapeDay[] };
        if (!cancelled) setScrapeDays(body.days ?? []);
      } catch (e) {
        if (!cancelled) {
          setDaysError(e instanceof Error ? e.message : "Impossible de charger les dates");
        }
      } finally {
        if (!cancelled) setDaysLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!days.length) return;
    setFromDay((prev) => prev || days[0]);
    setToDay((prev) => prev || days[days.length - 1]);
  }, [days]);

  const loadMovers = useCallback(async () => {
    if (!fromDay || !toDay) return;
    setAnalyzing(true);
    setError(null);
    setHasAnalyzed(true);
    setBySite({});
    const pending = Object.fromEntries(COMPETITORS.map((c) => [c.id, true])) as Record<
      SiteId,
      boolean
    >;
    setLoadingSites(pending);

    const params = new URLSearchParams({
      from: startOfDayIso(fromDay),
      to: endOfDayIso(toDay),
    });

    await Promise.all(
      COMPETITORS.map(async (competitor) => {
        try {
          const res = await fetch(
            `/api/review-growth?${params.toString()}&site=${competitor.id}`,
          );
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as { error?: string } | null;
            throw new Error(body?.error ?? `Erreur ${res.status}`);
          }
          const body = (await res.json()) as { bySite: MoversBySite };
          setBySite((prev) => ({ ...prev, [competitor.id]: body.bySite[competitor.id] ?? [] }));
        } catch (e) {
          setError((prev) => prev ?? (e instanceof Error ? e.message : "Erreur inconnue"));
          setBySite((prev) => ({ ...prev, [competitor.id]: [] }));
        } finally {
          setLoadingSites((prev) => ({ ...prev, [competitor.id]: false }));
        }
      }),
    );

    setAnalyzing(false);
  }, [fromDay, toDay]);

  const invalidRange = fromDay && toDay && fromDay > toDay;
  const anySiteLoading = analyzing || Object.values(loadingSites).some(Boolean);
  const selectedCompetitor = COMPETITORS.find((c) => c.id === selectedSite) ?? COMPETITORS[0];
  const selectedItems = bySite[selectedSite];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {COMPETITORS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedSite(c.id)}
            disabled={analyzing}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              c.id === selectedSite
                ? "bg-brand-700 text-white shadow"
                : "bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
            } disabled:opacity-60`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-end gap-3">
          <p className="text-[11px] text-slate-500">
            Top 25 par progression d&apos;avis sur la période (≥ 1 avis au départ) —{" "}
            {selectedCompetitor.label}.
          </p>

          <div className="ml-auto flex flex-wrap items-end gap-2">
            {daysLoading ? (
              <div className="flex items-center gap-2 pb-1 text-xs text-slate-500">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
                Dates…
              </div>
            ) : (
              <>
                <label className="flex flex-col gap-0.5 text-[10px] font-medium text-slate-600">
                  Du
                  <select
                    value={fromDay}
                    onChange={(e) => setFromDay(e.target.value)}
                    disabled={!hasData || analyzing}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 disabled:opacity-50"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {formatOfferUpdateDateShort(startOfDayIso(d))}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-0.5 text-[10px] font-medium text-slate-600">
                  Au
                  <select
                    value={toDay}
                    onChange={(e) => setToDay(e.target.value)}
                    disabled={!hasData || analyzing}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 disabled:opacity-50"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {formatOfferUpdateDateShort(startOfDayIso(d))}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <button
              type="button"
              onClick={loadMovers}
              disabled={!hasData || analyzing || daysLoading || Boolean(invalidRange)}
              className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-600 disabled:opacity-60"
            >
              {analyzing ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Analyse…
                </>
              ) : (
                "Analyser"
              )}
            </button>
          </div>
        </div>

        {daysError ? <p className="mt-3 text-sm text-rose-600">{daysError}</p> : null}
        {invalidRange ? (
          <p className="mt-3 text-sm text-amber-600">
            La date de début doit précéder la date de fin.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {!daysLoading && !hasData ? (
          <p className="mt-3 text-sm text-slate-400">
            Au moins deux jours de scrape distincts sont nécessaires. Indisponible en mode démo.
          </p>
        ) : null}
      </div>

      {hasAnalyzed ? (
        <div>
          {loadingSites[selectedSite] ? (
            <MoverSiteSkeleton />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="font-semibold text-brand-900">{selectedCompetitor.label}</h3>
                <p className="text-xs text-slate-500">
                  {selectedItems?.length ?? 0} référence{(selectedItems?.length ?? 0) > 1 ? "s" : ""} en progression
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
                {!selectedItems?.length ? (
                  <p className="py-4 text-center text-sm text-slate-400 col-span-full">
                    Aucune progression sur la période
                  </p>
                ) : (
                  selectedItems.map((p, i) => (
                    <ProductCard
                      key={p.parent_key ?? p.product_url}
                      site={p.site}
                      name={`${i + 1}. ${p.product_name}`}
                      url={p.product_url}
                      imageUrl={p.image_url}
                      priceText={p.price_text}
                      reviewCount={p.end_reviews}
                      reviewGrowth={p.review_growth}
                      variantCount={p.variant_count}
                      meta={`${p.start_reviews} → ${p.end_reviews} avis`}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 py-12 text-center">
          <p className="text-sm text-slate-500">
            Choisissez une période puis cliquez sur « Analyser ».
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Les résultats s&apos;affichent uniquement pour l&apos;acteur sélectionné.
          </p>
        </div>
      )}

      {anySiteLoading && hasAnalyzed ? (
        <p className="text-center text-xs text-slate-400">
          Chargement en cours — les résultats apparaissent dès qu&apos;ils sont prêts.
        </p>
      ) : null}
    </div>
  );
}
