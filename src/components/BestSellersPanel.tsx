"use client";

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
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
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
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-lg font-bold text-brand-900">Top 20 par nombre total d&apos;avis</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COMPETITORS.map((c) => (
            <SiteSection
              key={`reviews-${c.id}`}
              title={c.label}
              subtitle={`Produits les plus commentés · Offre MAJ le ${formatOfferUpdateDateShort(lastUpdates[c.id])}`}
              items={byReviews[c.id] ?? []}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-brand-900">
          Top 10 par évolution d&apos;avis
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Hausse du nombre d&apos;avis depuis la première collecte dans la base.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COMPETITORS.map((c) => (
            <SiteSection
              key={`growth-${c.id}`}
              title={c.label}
              subtitle={`Momentum — produits qui accélèrent · Offre MAJ le ${formatOfferUpdateDateShort(lastUpdates[c.id])}`}
              items={byGrowth[c.id] ?? []}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
