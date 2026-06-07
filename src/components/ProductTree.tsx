"use client";

import { useMemo, useState } from "react";
import { getProductsByCategory } from "@/lib/analytics";
import type { ProductRow, ProductTreeData, SiteId } from "@/lib/types";
import {
  countOverrides,
  getDefaultMacroForSub,
  moveSubcategory,
  resetAllOverrides,
  saveOverrides,
  type TaxonomyOverrides,
} from "@/lib/classification-overrides";
import { CategoryProductsModal } from "./CategoryProductsModal";

interface ProductTreeProps {
  trees: ProductTreeData[];
  products: ProductRow[];
  selectedSite: string;
  overrides: TaxonomyOverrides;
  onOverridesChange: (overrides: TaxonomyOverrides) => void;
  onSelectSite: (site: string) => void;
}

interface ModalState {
  macroId: string;
  subId?: string;
  title: string;
}

const DRAG_MIME = "application/x-mobilier-subcategory";

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

export function ProductTree({
  trees,
  products,
  selectedSite,
  overrides,
  onOverridesChange,
  onSelectSite,
}: ProductTreeProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draggingSubId, setDraggingSubId] = useState<string | null>(null);
  const [dropTargetMacroId, setDropTargetMacroId] = useState<string | null>(null);

  const tree = trees.find((t) => t.site === selectedSite) ?? trees[0];

  const modalProducts = useMemo(() => {
    if (!modal || !tree) return [];
    return getProductsByCategory(
      tree.site as SiteId,
      products,
      { macroId: modal.macroId, subId: modal.subId },
      overrides,
    );
  }, [modal, products, tree, overrides]);

  const handleOverridesChange = (next: TaxonomyOverrides) => {
    onOverridesChange(next);
    saveOverrides(next);
  };

  const handleDropSubcategory = (targetMacroId: string, subId: string) => {
    const next = moveSubcategory(overrides, subId, targetMacroId);
    handleOverridesChange(next);
    setDraggingSubId(null);
    setDropTargetMacroId(null);
  };

  if (!tree) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        Aucune donnée disponible pour afficher l&apos;arborescence.
      </div>
    );
  }

  const openCategory = (macroId: string, macroLabel: string) => {
    setModal({ macroId, title: macroLabel });
  };

  const openSubcategory = (macroId: string, subId: string, macroLabel: string, subLabel: string) => {
    setModal({ macroId, subId, title: `${macroLabel} — ${subLabel}` });
  };

  const overrideCount = countOverrides(overrides);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          {overrideCount > 0 ? (
            <button
              type="button"
              onClick={() => handleOverridesChange(resetAllOverrides())}
              className="text-xs text-slate-500 underline hover:text-brand-700"
            >
              Réinitialiser {overrideCount} réorganisation{overrideCount > 1 ? "s" : ""}
            </button>
          ) : null}
        </div>

        <p className="text-xs text-slate-500">
          Cliquez pour voir les produits.{" "}
          <strong>Maintenez et glissez</strong> une sous-catégorie (poignée ⋮⋮) vers une autre
          branche pour la déplacer. Les modifications sont enregistrées automatiquement.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="min-w-[900px]">
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

            <div className="relative flex justify-center gap-4">
              <div className="absolute left-[8%] right-[8%] top-0 h-px bg-brand-400" />
              {tree.categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`relative flex w-[min(180px,14%)] flex-col items-center rounded-lg pt-4 transition ${
                    dropTargetMacroId === cat.id ? "bg-brand-100 ring-2 ring-brand-400" : ""
                  }`}
                  onDragOver={(e) => {
                    if (!draggingSubId) return;
                    e.preventDefault();
                    setDropTargetMacroId(cat.id);
                  }}
                  onDragLeave={() => {
                    if (dropTargetMacroId === cat.id) setDropTargetMacroId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const subId = e.dataTransfer.getData(DRAG_MIME);
                    if (subId) handleDropSubcategory(cat.id, subId);
                  }}
                >
                  <div className="absolute top-0 h-4 w-px bg-brand-400" />

                  <button
                    type="button"
                    onClick={() => openCategory(cat.id, cat.label)}
                    className="w-full rounded border-2 border-brand-600 bg-white px-2 py-2 text-center text-xs font-semibold text-brand-900 transition hover:border-brand-800 hover:bg-brand-50 hover:shadow-sm"
                    title={`Voir les ${cat.count} produits`}
                  >
                    {cat.label}
                  </button>

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

                  <button
                    type="button"
                    onClick={() => openCategory(cat.id, cat.label)}
                    className="mt-1 w-full rounded border border-brand-300 bg-white px-2 py-1 text-center text-[11px] font-medium transition hover:border-brand-500 hover:bg-brand-50"
                    title="Voir les produits"
                  >
                    <CountSplit products={cat.count} collections={cat.collectionCount} />
                    <span className="block text-[9px] font-normal text-slate-400">prod. | coll.</span>
                  </button>

                  <div className="mt-2 h-4 w-px bg-brand-300" />

                  <div className="w-full space-y-1 pb-2">
                    {cat.subcategories.map((sub) => {
                      const isMoved = overrides.subcategoryMacro[sub.id] !== undefined;
                      const defaultMacro = getDefaultMacroForSub(sub.id);
                      const isDragging = draggingSubId === sub.id;

                      return (
                        <div
                          key={sub.id}
                          className={`flex w-full gap-0.5 text-[10px] ${isDragging ? "opacity-40" : ""}`}
                        >
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(DRAG_MIME, sub.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggingSubId(sub.id);
                            }}
                            onDragEnd={() => {
                              setDraggingSubId(null);
                              setDropTargetMacroId(null);
                            }}
                            className="flex cursor-grab items-center rounded border border-slate-300 bg-slate-100 px-0.5 text-slate-400 active:cursor-grabbing hover:bg-slate-200"
                            title="Glisser vers une autre catégorie"
                          >
                            ⋮⋮
                          </div>
                          <button
                            type="button"
                            onClick={() => openSubcategory(cat.id, sub.id, cat.label, sub.label)}
                            className="flex min-w-0 flex-1 gap-1 text-left transition hover:opacity-80"
                            title={`Voir les ${sub.count} produits`}
                          >
                            <div
                              className={`flex-1 rounded border px-1 py-1 text-center leading-tight ${
                                isMoved
                                  ? "border-amber-300 bg-amber-50"
                                  : "border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50"
                              }`}
                            >
                              {sub.label}
                              {isMoved && defaultMacro !== cat.id ? (
                                <span className="mt-0.5 block text-[8px] text-amber-600">déplacé</span>
                              ) : null}
                            </div>
                            <div className="min-w-[3.25rem] rounded border border-slate-300 bg-white px-1 py-1 text-center text-[9px] font-semibold leading-tight hover:border-brand-400 hover:bg-brand-50">
                              <CountSplit products={sub.count} collections={sub.collectionCount} />
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CategoryProductsModal
        open={modal !== null}
        title={modal?.title ?? ""}
        siteLabel={tree.label}
        products={modalProducts}
        overrides={overrides}
        onOverridesChange={handleOverridesChange}
        onClose={() => setModal(null)}
      />
    </>
  );
}
