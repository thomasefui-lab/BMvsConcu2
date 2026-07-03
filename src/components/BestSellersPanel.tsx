"use client";

import { useState } from "react";
import type { BestSellerProduct, SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";
import { formatOfferUpdateDateShort } from "@/lib/dates";
import { ProductCard } from "./ProductCard";

interface BestSellersPanelProps {
  byReviews: Record<SiteId, BestSellerProduct[]>;
  byGrowth: Record<SiteId, BestSellerProduct[]>;
  lastUpdates: Record<SiteId, string | null>;
}

function SiteSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: BestSellerProduct[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-semibold text-brand-900">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">Pas assez de données</p>
        ) : (
          items.map((p, i) => (
            <ProductCard
              key={p.parent_key ?? p.product_url}
              site={p.site}
              name={`${i + 1}. ${p.product_name}`}
              url={p.product_url}
              imageUrl={p.image_url}
              priceText={p.price_text}
              reviewCount={p.review_count}
              reviewGrowth={p.review_growth}
              meta={p.category_name}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function BestSellersPanel({ byReviews, byGrowth, lastUpdates }: BestSellersPanelProps) {
  const [selectedSite, setSelectedSite] = useState<SiteId>("bestmobilier");
  const selectedCompetitor = COMPETITORS.find((c) => c.id === selectedSite) ?? COMPETITORS[0];
  const reviewItems = byReviews[selectedSite] ?? [];
  const growthItems = byGrowth[selectedSite] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {COMPETITORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedSite(c.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                c.id === selectedSite
                  ? "bg-brand-700 text-white shadow"
                  : "bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
              }`}
            >
              {c.label}
              <span className="ml-1.5 opacity-80">({byReviews[c.id]?.length ?? 0})</span>
              <span
                className={`mt-0.5 block text-[10px] font-normal ${
                  c.id === selectedSite ? "text-brand-200" : "text-slate-400"
                }`}
              >
                MAJ {formatOfferUpdateDateShort(lastUpdates[c.id])}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          Catalogue actuel — 50 références max pour l&apos;acteur sélectionné.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-brand-900">
          Top 50 par avis — {selectedCompetitor.label}
        </h2>
        <SiteSection
          title={selectedCompetitor.label}
          subtitle={`Produits les plus commentés · Offre MAJ le ${formatOfferUpdateDateShort(lastUpdates[selectedSite])}`}
          items={reviewItems}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-brand-900">
          Top 50 par évolution d&apos;avis — {selectedCompetitor.label}
        </h2>
        <p className="mb-2 text-[11px] text-slate-500">
          Hausse depuis la première collecte en base.
        </p>
        <SiteSection
          title={selectedCompetitor.label}
          subtitle={`Momentum — produits qui accélèrent · Offre MAJ le ${formatOfferUpdateDateShort(lastUpdates[selectedSite])}`}
          items={growthItems}
        />
      </section>
    </div>
  );
}
