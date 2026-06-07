"use client";

import type { ProductTreeData } from "@/lib/types";

interface ProductTreeProps {
  trees: ProductTreeData[];
  selectedSite: string;
  onSelectSite: (site: string) => void;
}

function CountSplit({
  products,
  collections,
  className = "",
}: {
  products: number;
  collections: number;
  className?: string;
}) {
  return (
    <span className={`tabular-nums ${className}`}>
      {products.toLocaleString("fr-FR")}
      <span className="mx-0.5 font-normal text-slate-400">|</span>
      {collections.toLocaleString("fr-FR")}
    </span>
  );
}

export function ProductTree({ trees, selectedSite, onSelectSite }: ProductTreeProps) {
  const tree = trees.find((t) => t.site === selectedSite) ?? trees[0];

  if (!tree) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        Aucune donnée disponible pour afficher l&apos;arborescence.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {trees.map((t) => (
          <button
            key={t.site}
            onClick={() => onSelectSite(t.site)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              t.site === tree.site
                ? "bg-brand-700 text-white shadow"
                : "bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
            }`}
          >
            {t.label}
            <span className="ml-2 opacity-80">({t.total})</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
        <div className="min-w-[900px]">
          {/* Racine */}
          <div className="flex items-start justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="rounded-md bg-brand-800 px-8 py-3 text-center text-white shadow-lg">
                <div className="text-lg font-bold tracking-wide">{tree.label.toUpperCase()}</div>
              </div>
              <div className="mt-2 rounded border-2 border-brand-700 bg-white px-6 py-2 text-center text-sm font-semibold text-brand-900">
                <CountSplit products={tree.total} collections={tree.totalCollections} />
                <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
                  produits | collections
                </span>
              </div>
              <div className="h-8 w-px bg-brand-400" />
            </div>

            <div className="mt-1 min-w-[120px] rounded-lg border-2 border-brand-500 bg-white px-4 py-3 text-center shadow-sm">
              <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Collections
              </div>
              <div className="text-2xl font-bold text-brand-800">
                {tree.totalCollections.toLocaleString("fr-FR")}
              </div>
              <div className="text-[10px] text-slate-400">noms uniques</div>
            </div>
          </div>

          {/* Branches principales */}
          <div className="relative flex justify-center gap-4">
            <div className="absolute left-[8%] right-[8%] top-0 h-px bg-brand-400" />
            {tree.categories.map((cat) => (
              <div key={cat.id} className="relative flex w-[min(180px,14%)] flex-col items-center pt-4">
                <div className="absolute top-0 h-4 w-px bg-brand-400" />

                <div className="w-full rounded border-2 border-brand-600 bg-white px-2 py-2 text-center text-xs font-semibold text-brand-900">
                  {cat.label}
                </div>

                <div className="mt-2 w-full px-1">
                  <div className="relative h-3 overflow-hidden rounded-sm bg-slate-200">
                    <div
                      className="h-full bg-brand-500 transition-all"
                      style={{ width: `${Math.max(cat.percent, 2)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-brand-900">
                      {cat.percent}%
                    </span>
                  </div>
                </div>

                <div className="mt-1 w-full rounded border border-brand-300 bg-white px-2 py-1 text-center text-[11px] font-medium">
                  <CountSplit products={cat.count} collections={cat.collectionCount} />
                  <span className="block text-[9px] font-normal text-slate-400">prod. | coll.</span>
                </div>

                <div className="mt-2 h-4 w-px bg-brand-300" />

                {/* Sous-catégories */}
                <div className="w-full space-y-1">
                  {cat.subcategories.map((sub) => (
                    <div key={sub.id} className="flex gap-1 text-[10px]">
                      <div className="flex-1 rounded border border-slate-300 bg-white px-1 py-1 text-center leading-tight">
                        {sub.label}
                      </div>
                      <div className="min-w-[3.25rem] rounded border border-slate-300 bg-white px-1 py-1 text-center text-[9px] font-semibold leading-tight">
                        <CountSplit products={sub.count} collections={sub.collectionCount} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
