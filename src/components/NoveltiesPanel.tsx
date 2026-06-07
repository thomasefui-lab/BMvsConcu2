"use client";

import type { NoveltyMatrixCell, NoveltyProduct, SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";
import { ProductCard } from "./ProductCard";

interface NoveltiesPanelProps {
  matrix: NoveltyMatrixCell[];
  topBySite: Record<SiteId, NoveltyProduct[]>;
}

export function NoveltiesPanel({ matrix, topBySite }: NoveltiesPanelProps) {
  const macroGroups = [...new Set(matrix.map((m) => m.macroLabel))];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-brand-50 px-4 py-3">
          <h3 className="font-semibold text-brand-900">Nouveautés par catégorie</h3>
          <p className="text-xs text-slate-500">
            Produit nouveau = première apparition sans avis. Remis en ligne avec avis = exclu.
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
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
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
                    {COMPETITORS.map((c) => (
                      <td key={c.id} className="px-3 py-2 text-center font-semibold">
                        {row.counts[c.id] > 0 ? (
                          <span className={c.isOwn ? "text-brand-700" : "text-slate-700"}>{row.counts[c.id]}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
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

      <div className="space-y-6">
        {COMPETITORS.map((c) => {
          const items = topBySite[c.id] ?? [];
          return (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="font-semibold text-brand-900">
                  Top 10 nouveautés — {c.label}
                </h3>
                <p className="text-xs text-slate-500">Classées par hausse d&apos;avis</p>
              </div>
              <div className="space-y-2 p-3">
                {items.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">Aucune nouveauté détectée</p>
                ) : (
                  items.map((p, i) => (
                    <ProductCard
                      key={p.product_url}
                      site={p.site}
                      name={`${i + 1}. ${p.product_name}`}
                      url={p.product_url}
                      imageUrl={p.image_url}
                      priceText={p.price_text}
                      reviewCount={p.review_count}
                      reviewGrowth={p.review_growth}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
