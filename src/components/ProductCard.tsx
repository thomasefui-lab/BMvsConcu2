"use client";

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
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const color = productPlaceholderColor(site);
  const showImage = imageUrl && !imageFailed;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-brand-400 hover:shadow-md"
    >
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md"
        style={{ backgroundColor: showImage ? "#f8fafc" : color }}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lg font-bold text-white/90">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-brand-700">{name}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
          {priceText && <span>{priceText}</span>}
          <span>{reviewCount} avis</span>
          {reviewGrowth !== undefined && reviewGrowth > 0 && (
            <span className="font-semibold text-emerald-600">+{reviewGrowth}</span>
          )}
        </div>
        {meta && <p className="mt-1 text-[10px] text-slate-400">{meta}</p>}
      </div>
    </a>
  );
}
