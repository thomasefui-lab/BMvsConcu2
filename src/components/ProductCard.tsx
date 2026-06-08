"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { SiteId } from "@/lib/types";
import { productPlaceholderColor } from "@/lib/images";

interface ProductCardProps {
  site: SiteId;
  name: string;
  url: string;
  imageUrl: string | null;
  priceText: string | null;
  reviewCount: number;
  reviewGrowth?: number;
  meta?: string;
  variantCount?: number;
  actions?: ReactNode;
}

export function ProductCard({
  site,
  name,
  url,
  imageUrl,
  priceText,
  reviewCount,
  reviewGrowth,
  meta,
  variantCount,
  actions,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const color = productPlaceholderColor(site);
  const showImage = imageUrl && !imageFailed;

  return (
    <div className="group flex flex-col rounded-lg border border-slate-200 bg-white transition hover:border-brand-400 hover:shadow-md">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 flex-col"
      >
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg"
          style={{ backgroundColor: showImage ? "#f8fafc" : color }}
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-contain p-2 transition group-hover:scale-[1.02]"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-bold text-white/90">
              {name.replace(/^\d+\.\s*/, "").charAt(0) || "?"}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-brand-700">
            {name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            {priceText ? <span className="font-medium text-slate-700">{priceText}</span> : null}
            <span>{reviewCount} avis</span>
            {reviewGrowth !== undefined && reviewGrowth > 0 ? (
              <span className="font-semibold text-emerald-600">+{reviewGrowth}</span>
            ) : null}
            {(variantCount ?? 1) > 1 ? (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                {variantCount} couleurs
              </span>
            ) : null}
          </div>
          {meta ? <p className="mt-1.5 line-clamp-1 text-[10px] text-slate-400">{meta}</p> : null}
        </div>
      </a>

      {actions ? <div className="border-t border-slate-100 px-3 py-2">{actions}</div> : null}
    </div>
  );
}
