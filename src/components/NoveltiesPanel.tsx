"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildNoveltyMatrix,
  getNoveltiesForCategory,
} from "@/lib/analytics";
import type { TaxonomyOverrides } from "@/lib/classification-overrides";
import { formatOfferUpdateDateShort } from "@/lib/dates";
import type { NoveltyMatrixCell, ProductRow, ScrapeDay, SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";
import { NoveltyProductsModal } from "./NoveltyProductsModal";

interface NoveltiesPanelProps {
  products: ProductRow[];
  overrides: TaxonomyOverrides;
  lastUpdates: Record<SiteId, string | null>;
}

interface CellModalState {
  site: SiteId;
  siteLabel: string;
  macroId: string;
  subId: string;
  title: string;
}

export function NoveltiesPanel({ products, overrides, lastUpdates }: NoveltiesPanelProps) {
  const [cellModal, setCellModal] = useState<CellModalState | null>(null);
  const [scrapeDays, setScrapeDays] = useState<ScrapeDay[]>([]);
  const [sinceDay, setSinceDay] = useState<string>("");
  const [useCustomSince, setUseCustomSince] = useState(false);

  useEffect(() => {
    fetch("/api/scrape-days")
      .then((r) => r.json())
      .then((body: { days: ScrapeDay[] }) => setScrapeDays(body.days ?? []))
      .catch(() => setScrapeDays([]));
  }, []);

  const availableDays = useMemo(
    () => [...new Set(scrapeDays.map((d) => d.scrape_day).filter(Boolean))].sort(),
    [scrapeDays],
  );

  const noveltyOptions = useMemo(
    () => (useCustomSince && sinceDay ? { sinceDay } : undefined),
    [useCustomSince, sinceDay],
  );

  const matrix = useMemo(
    () => buildNoveltyMatrix(products, overrides, noveltyOptions),
    [products, overrides, noveltyOptions],
  );

  const macroGroups = [...new Set(matrix.map((m) => m.macroLabel))];

  const modalProducts = useMemo(() => {
    if (!cellModal) return [];
    return getNoveltiesForCategory(
      products,
      cellModal.site,
      cellModal.macroId,
      cellModal.subId,
      overrides,
      noveltyOptions,
    );
  }, [cellModal, products, overrides, noveltyOptions]);

  const openCell = (row: NoveltyMatrixCell, site: SiteId, siteLabel: string) => {
    if (row.counts[site] <= 0) return;
    setCellModal({
      site,
      siteLabel,
      macroId: row.macroId,
      subId: row.subId,
      title: `${row.macroLabel} — ${row.subLabel}`,
    });
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={useCustomSince}
            onChange={(e) => {
              setUseCustomSince(e.target.checked);
              if (e.target.checked && !sinceDay && availableDays.length) {
                setSinceDay(availableDays[0]);
              }
            }}
          />
          Nouveautés depuis le
        </label>
        <select
          value={sinceDay}
          disabled={!useCustomSince || !availableDays.length}
          onChange={(e) => setSinceDay(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
        >
          {availableDays.map((d) => (
            <option key={d} value={d}>
              {formatOfferUpdateDateShort(`${d}T12:00:00.000Z`)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-brand-50 px-3 py-2">
          <h3 className="text-xs font-semibold text-brand-900">Nouveautés par catégorie</h3>
          <p className="text-[10px] text-slate-500">
            Sans avis à l&apos;entrée. Cliquez sur un chiffre pour le détail.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Sous-catégorie</th>
                {COMPETITORS.map((c) => (
                  <th key={c.id} className="px-3 py-3 text-center">
                    <div>{c.label}</div>
                    <div className="mt-0.5 text-[10px] font-normal normal-case tracking-normal text-slate-400">
                      MAJ {formatOfferUpdateDateShort(lastUpdates[c.id])}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {macroGroups.length === 0 ? (
                <tr>
                  <td colSpan={2 + COMPETITORS.length} className="px-4 py-8 text-center text-slate-400">
                    Aucune nouveauté depuis la base de référence — normal tant que les agents n&apos;ont
                    tourné qu&apos;une fois.
                  </td>
                </tr>
              ) : null}
              {macroGroups.map((macro) => {
                const rows = matrix.filter((m) => m.macroLabel === macro);
                return rows.map((row, idx) => (
                  <tr key={`${row.macroId}-${row.subId}`} className="border-b border-slate-100 hover:bg-slate-50">
                    {idx === 0 ? (
                      <td className="px-4 py-2 font-medium text-brand-800" rowSpan={rows.length}>
                        {macro}
                      </td>
                    ) : null}
                    <td className="px-4 py-2 text-slate-600">{row.subLabel}</td>
                    {COMPETITORS.map((c) => {
                      const count = row.counts[c.id];
                      const clickable = count > 0;
                      return (
                        <td key={c.id} className="px-3 py-2 text-center font-semibold">
                          {clickable ? (
                            <button
                              type="button"
                              onClick={() => openCell(row, c.id, c.label)}
                              className={`rounded-md px-2 py-0.5 transition hover:bg-brand-100 hover:underline ${
                                c.isOwn ? "text-brand-700" : "text-slate-700"
                              }`}
                              title={`Voir les ${count} nouveautés — ${c.label}`}
                            >
                              {count}
                            </button>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ));
              })}
            </tbody>
            <tfoot>
              <tr className="bg-brand-50 font-semibold">
                <td className="px-4 py-3" colSpan={2}>
                  Total nouveautés
                </td>
                {COMPETITORS.map((c) => (
                  <td key={c.id} className="px-3 py-3 text-center text-brand-800">
                    {matrix.reduce((sum, row) => sum + row.counts[c.id], 0)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <NoveltyProductsModal
        open={cellModal !== null}
        title={cellModal?.title ?? ""}
        siteLabel={cellModal?.siteLabel ?? ""}
        products={modalProducts}
        onClose={() => setCellModal(null)}
      />
    </>
  );
}
