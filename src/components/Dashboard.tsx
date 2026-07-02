"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { DashboardData } from "@/lib/types";
import {
  buildAllProductTrees,
  buildBestSellers,
  buildTopReviewGrowth,
  countParentReferences,
  getLastOfferUpdateBySite,
} from "@/lib/analytics";
import { loadOverrides, type TaxonomyOverrides } from "@/lib/classification-overrides";
import { ProductTree } from "./ProductTree";
import { NoveltiesPanel } from "./NoveltiesPanel";
import { BestSellersPanel } from "./BestSellersPanel";
import { BestMoversPanel } from "./BestMoversPanel";
import { PriceEvolutionPanel } from "./PriceEvolutionPanel";
import { TreePrintView } from "./TreePrintView";
import { LoadingSpinner } from "./ui/LoadingSpinner";

const TABS = [
  { id: "tree", label: "Arborescence produits" },
  { id: "novelties", label: "Nouveautés" },
  { id: "bestsellers", label: "Runners Historiques" },
  { id: "movers", label: "Meilleures ventes actuelles" },
  { id: "prices", label: "Évolution des prix" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface DashboardProps {
  data: DashboardData;
}

export function Dashboard({ data }: DashboardProps) {
  const [tab, setTab] = useState<TabId>("tree");
  const [visited, setVisited] = useState<Set<TabId>>(() => new Set(["tree"]));
  const [isTabPending, startTabTransition] = useTransition();
  const [selectedSite, setSelectedSite] = useState("bestmobilier");
  const [overrides, setOverrides] = useState<TaxonomyOverrides>(() => loadOverrides());
  const [printTrees, setPrintTrees] = useState<ReturnType<typeof buildAllProductTrees> | null>(null);

  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

  const parentCount = useMemo(() => countParentReferences(data.products), [data.products]);
  const lastUpdates = useMemo(() => getLastOfferUpdateBySite(data.products), [data.products]);

  const bestSellers = useMemo(
    () =>
      tab === "bestsellers" || visited.has("bestsellers")
        ? buildBestSellers(data.products, 20)
        : undefined,
    [data.products, tab, visited],
  );
  const topGrowth = useMemo(
    () =>
      tab === "bestsellers" || visited.has("bestsellers")
        ? buildTopReviewGrowth(data.products)
        : undefined,
    [data.products, tab, visited],
  );

  const printRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [exporting, setExporting] = useState(false);
  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const built = buildAllProductTrees(data.products, overrides);
      setPrintTrees(built);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const elements = printRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const { exportTreesPDF } = await import("@/lib/export-pdf");
      await exportTreesPDF(elements);
    } finally {
      setPrintTrees(null);
      setExporting(false);
    }
  }, [data.products, overrides]);

  const selectTab = (id: TabId) => {
    startTabTransition(() => {
      setTab(id);
      setVisited((prev) => new Set(prev).add(id));
    });
  };

  const showTabLoader = isTabPending;

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
                {exporting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Génération…
                  </>
                ) : (
                  "Exporter PDF"
                )}
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
                  {data.products.length.toLocaleString("fr-FR")} URLs (dernier scrape)
                </p>
                <p className="mt-1 max-w-xs text-[10px] leading-snug text-brand-300">
                  Produits retirés du site : absents de cette vue, conservés dans l&apos;historique.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {printTrees ? (
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
          {printTrees.map((tree, i) => (
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
      ) : null}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <nav className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            const isLoading = isTabPending && isActive;
            return (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
                disabled={isTabPending}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-700 text-white shadow"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50"
                } disabled:opacity-70`}
              >
                {isLoading ? (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : null}
                {t.label}
              </button>
            );
          })}
        </nav>

        {showTabLoader ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
            <LoadingSpinner label="Préparation de l'onglet…" />
          </div>
        ) : null}

        {!showTabLoader && tab === "tree" && data.products.length > 0 ? (
          <ProductTree
            products={data.products}
            selectedSite={selectedSite}
            overrides={overrides}
            onOverridesChange={setOverrides}
            onSelectSite={setSelectedSite}
            lastUpdates={lastUpdates}
          />
        ) : null}

        {!showTabLoader && tab === "novelties" ? (
          <NoveltiesPanel
            products={data.products}
            overrides={overrides}
            lastUpdates={lastUpdates}
          />
        ) : null}

        {!showTabLoader && tab === "bestsellers" && bestSellers && topGrowth ? (
          <BestSellersPanel byReviews={bestSellers} byGrowth={topGrowth} lastUpdates={lastUpdates} />
        ) : null}

        {!showTabLoader && tab === "movers" ? <BestMoversPanel /> : null}

        {!showTabLoader && tab === "prices" ? (
          <PriceEvolutionPanel products={data.products} />
        ) : null}
      </div>
    </div>
  );
}
