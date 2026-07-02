"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReviewMoverProduct, ScrapeDay, SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";
import { formatOfferUpdateDateShort } from "@/lib/dates";
import { ProductCard } from "./ProductCard";

interface BestMoversPanelProps {
  scrapeDays: ScrapeDay[];
}

type MoversBySite = Record<SiteId, ReviewMoverProduct[]>;

function uniqueSortedDays(scrapeDays: ScrapeDay[]): string[] {
  return [...new Set(scrapeDays.map((d) => d.scrape_day).filter(Boolean))].sort();
}

/** Borne haute d'un jour = fin de journée, pour inclure tous les scrapes du jour. */
function endOfDayIso(day: string): string {
  return `${day}T23:59:59.999Z`;
}

/** Borne basse d'un jour = début de journée. */
function startOfDayIso(day: string): string {
  return `${day}T00:00:00.000Z`;
}

export function BestMoversPanel({ scrapeDays }: BestMoversPanelProps) {
  const days = useMemo(() => uniqueSortedDays(scrapeDays), [scrapeDays]);
  const hasData = days.length >= 2;

  const [fromDay, setFromDay] = useState<string>(days[0] ?? "");
  const [toDay, setToDay] = useState<string>(days[days.length - 1] ?? "");
  const [bySite, setBySite] = useState<MoversBySite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromDay && days.length) setFromDay(days[0]);
    if (!toDay && days.length) setToDay(days[days.length - 1]);
  }, [days, fromDay, toDay]);

  const loadMovers = async () => {
    if (!fromDay || !toDay) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: startOfDayIso(fromDay),
        to: endOfDayIso(toDay),
      });
      const res = await fetch(`/api/review-growth?${params.toString()}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Erreur ${res.status}`);
      }
      const body = (await res.json()) as { bySite: MoversBySite };
      setBySite(body.bySite);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setBySite(null);
    } finally {
      setLoading(false);
    }
  };

  const invalidRange = fromDay && toDay && fromDay > toDay;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <h2 className="text-lg font-bold text-brand-900">Proxy des meilleurs</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Top 25 des références dont le nombre d&apos;avis a le plus progressé sur la période
              choisie (à partir d&apos;au moins 1 avis en début de période). Les avis servent de
              proxy des ventes.
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Du
              <select
                value={fromDay}
                onChange={(e) => setFromDay(e.target.value)}
                disabled={!hasData}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:opacity-50"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {formatOfferUpdateDateShort(startOfDayIso(d))}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Au
              <select
                value={toDay}
                onChange={(e) => setToDay(e.target.value)}
                disabled={!hasData}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:opacity-50"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {formatOfferUpdateDateShort(startOfDayIso(d))}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={loadMovers}
              disabled={!hasData || loading || Boolean(invalidRange)}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? "Calcul…" : "Analyser"}
            </button>
          </div>
        </div>

        {invalidRange ? (
          <p className="mt-3 text-sm text-amber-600">
            La date de début doit précéder la date de fin.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {!hasData ? (
          <p className="mt-3 text-sm text-slate-400">
            Au moins deux jours de scrape distincts sont nécessaires pour mesurer une évolution.
            Indisponible en mode démo (une seule collecte).
          </p>
        ) : null}
      </div>

      {bySite ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COMPETITORS.map((c) => {
            const items = bySite[c.id] ?? [];
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="font-semibold text-brand-900">{c.label}</h3>
                  <p className="text-xs text-slate-500">
                    {items.length} référence{items.length > 1 ? "s" : ""} en progression
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                  {items.length === 0 ? (
                    <p className="py-4 text-center text-sm text-slate-400">
                      Aucune progression sur la période
                    </p>
                  ) : (
                    items.map((p, i) => (
                      <ProductCard
                        key={p.parent_key ?? p.product_url}
                        site={p.site}
                        name={`${i + 1}. ${p.product_name}`}
                        url={p.product_url}
                        imageUrl={p.image_url}
                        priceText={p.price_text}
                        reviewCount={p.end_reviews}
                        reviewGrowth={p.review_growth}
                        meta={`${p.start_reviews} → ${p.end_reviews} avis`}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          Choisissez une période puis cliquez sur « Analyser ».
        </p>
      )}
    </div>
  );
}
