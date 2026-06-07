"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/types";
import {
  buildAllProductTrees,
  buildBestSellers,
  buildNoveltyMatrix,
  buildTopNoveltiesBySite,
  buildTopReviewGrowth,
  countParentReferences,
} from "@/lib/analytics";
import { ProductTree } from "./ProductTree";
import { NoveltiesPanel } from "./NoveltiesPanel";
import { BestSellersPanel } from "./BestSellersPanel";

const TABS = [
  { id: "tree", label: "Arborescence produits" },
  { id: "novelties", label: "Nouveautés" },
  { id: "bestsellers", label: "Best sellers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface DashboardProps {
  data: DashboardData;
}

export function Dashboard({ data }: DashboardProps) {
  const [tab, setTab] = useState<TabId>("tree");
  const [selectedSite, setSelectedSite] = useState("bestmobilier");

  const parentCount = countParentReferences(data.products);
  const trees = buildAllProductTrees(data.products);
  const noveltyMatrix = buildNoveltyMatrix(data.products);
  const topNovelties = buildTopNoveltiesBySite(data.products);
  const bestSellers = buildBestSellers(data.products);
  const topGrowth = buildTopReviewGrowth(data.products);

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
      </header>

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
            onSelectSite={setSelectedSite}
          />
        )}
        {tab === "novelties" && <NoveltiesPanel matrix={noveltyMatrix} topBySite={topNovelties} />}
        {tab === "bestsellers" && (
          <BestSellersPanel byReviews={bestSellers} byGrowth={topGrowth} />
        )}
      </div>
    </div>
  );
}
