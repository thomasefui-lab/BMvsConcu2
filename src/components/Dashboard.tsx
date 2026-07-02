"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardData, ScrapeDay } from "@/lib/types";
import {
  buildAllProductTrees,
  buildBestSellers,
  buildNoveltyMatrix,
  buildTopNoveltiesBySite,
  buildTopReviewGrowth,
  countParentReferences,
  getLastOfferUpdateBySite,
} from "@/lib/analytics";
import { loadOverrides, type TaxonomyOverrides } from "@/lib/classification-overrides";
import { ProductTree } from "./ProductTree";
import { NoveltiesPanel } from "./NoveltiesPanel";
import { BestSellersPanel } from "./BestSellersPanel";
import { BestMoversPanel } from "./BestMoversPanel";
import { TreePrintView } from "./TreePrintView";

const TABS = [
  { id: "tree", label: "Arborescence produits" },
  { id: "novelties", label: "Nouveautés" },
  { id: "bestsellers", label: "Best sellers" },
  { id: "movers", label: "Proxy des meilleurs" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface DashboardProps {
  data: DashboardData;
  scrapeDays: ScrapeDay[];
}

export function Dashboard({ data, scrapeDays }: DashboardProps) {
  const [tab, setTab] = useState<TabId>("tree");
  const [selectedSite, setSelectedSite] = useState("bestmobilier");
  const [overrides, setOverrides] = useState<TaxonomyOverrides>(() => loadOverrides());

  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  const parentCount = countParentReferences(data.products);
  const trees = useMemo(
    () => buildAllProductTrees(data.products, overrides),
    [data.products, overrides],
  );
  const noveltyMatrix = useMemo(
    () => buildNoveltyMatrix(data.products, overrides),
    [data.products, overrides],
  );
  const topNovelties = buildTopNoveltiesBySite(data.products);
  const bestSellers = buildBestSellers(data.products, 20);
  const topGrowth = buildTopReviewGrowth(data.products);
  const lastUpdates = useMemo(() => getLastOfferUpdateBySite(data.products), [data.products]);

  // Refs sur chaque arbre de print
  const printRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [exporting, setExporting] = useState(false);
  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const elements = printRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const { exportTreesPDF } = await import("@/lib/export-pdf");
      await exportTreesPDF(elements);
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-brand-800 bg-brand-900 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-brand-200">
                Veille concurrentielle mobilier
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">Best Mobilier — Dashboard offre</h1>
            </div>
            <div className="flex items-end gap-4">
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-600 disabled:opacity-60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 0 1 1 1v7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L9 11.586V4a1 1 0 0 1 1-1Z"
                    clipRule="evenodd"
                  />
                  <path d="M3 15a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" />
                </svg>
                {exporting ? "Génération…" : "Exporter PDF"}
              </button>
              <div className="text-right text-xs text-brand-200">
                <p>
                  Source :{" "}
                  <span className="font-semibold text-white">
                    {data.source === "supabase" ? "Supabase (live)" : "Données démo locales"}
                  </span>
                </p>
                <p>
                  {parentCount.toLocaleString("fr-FR")} références parent
                  <span className="text-brand-300"> · </span>
                  {data.products.length.toLocaleString("fr-FR")} URLs
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteneurs hors-écran pour la capture PDF — 1 arbre par acteur */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "1122px",
          pointerEvents: "none",
        }}
      >
        {trees.map((tree, i) => (
          <TreePrintView
            key={tree.site}
            ref={(el) => {
              printRefs.current[i] = el;
            }}
            tree={tree}
            overrides={overrides}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <nav className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-brand-700 text-white shadow"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "tree" && (
          <ProductTree
            trees={trees}
            products={data.products}
            selectedSite={selectedSite}
            overrides={overrides}
            onOverridesChange={setOverrides}
            onSelectSite={setSelectedSite}
            lastUpdates={lastUpdates}
          />
        )}
        {tab === "novelties" && (
          <NoveltiesPanel
            matrix={noveltyMatrix}
            topBySite={topNovelties}
            products={data.products}
            overrides={overrides}
            lastUpdates={lastUpdates}
          />
        )}
        {tab === "bestsellers" && (
          <BestSellersPanel byReviews={bestSellers} byGrowth={topGrowth} lastUpdates={lastUpdates} />
        )}
        {tab === "movers" && <BestMoversPanel scrapeDays={scrapeDays} />}
      </div>
    </div>
  );
}
