"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { DashboardData } from "@/lib/types";
import { buildBestSellers, buildTopReviewGrowth, getLastOfferUpdateBySite } from "@/lib/analytics";
import { loadOverrides, type TaxonomyOverrides } from "@/lib/classification-overrides";
import { ProductTree } from "./ProductTree";
import { NoveltiesPanel } from "./NoveltiesPanel";
import { BestSellersPanel } from "./BestSellersPanel";
import { BestMoversPanel } from "./BestMoversPanel";
import { PriceEvolutionPanel } from "./PriceEvolutionPanel";
import { LoadingSpinner } from "./ui/LoadingSpinner";

const TABS = [
  { id: "tree", label: "Arborescence" },
  { id: "novelties", label: "Nouveautés" },
  { id: "bestsellers", label: "Runners historiques" },
  { id: "movers", label: "Meilleures ventes" },
  { id: "prices", label: "Évolution prix" },
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

  useEffect(() => {
    setOverrides(loadOverrides());
  }, []);

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

  const selectTab = (id: TabId) => {
    startTabTransition(() => {
      setTab(id);
      setVisited((prev) => new Set(prev).add(id));
    });
  };

  const showTabLoader = isTabPending;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-40 shrink-0 flex-col border-r border-slate-200 bg-white sm:w-44">
        <nav className="flex flex-col gap-0.5 p-2 pt-3">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            const isLoading = isTabPending && isActive;
            return (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
                disabled={isTabPending}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-left text-xs font-medium leading-tight transition ${
                  isActive
                    ? "bg-brand-700 text-white"
                    : "text-slate-600 hover:bg-brand-50 hover:text-brand-800"
                } disabled:opacity-70`}
              >
                {isLoading ? (
                  <span className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : null}
                {t.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto p-2 sm:p-3">
        {showTabLoader ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-white py-12">
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
      </main>
    </div>
  );
}
