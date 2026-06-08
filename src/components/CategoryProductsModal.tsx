"use client";

import { useEffect } from "react";
import type { ProductRow } from "@/lib/types";
import { guessProductImageUrl } from "@/lib/images";
import {
  assignProduct,
  clearProductAssignment,
  type TaxonomyOverrides,
} from "@/lib/classification-overrides";
import { ProductAssignControls } from "./ProductAssignControls";
import { ProductCard } from "./ProductCard";

interface CategoryProductsModalProps {
  open: boolean;
  title: string;
  siteLabel: string;
  products: ProductRow[];
  overrides: TaxonomyOverrides;
  onOverridesChange: (overrides: TaxonomyOverrides) => void;
  onClose: () => void;
}

export function CategoryProductsModal({
  open,
  title,
  siteLabel,
  products,
  overrides,
  onOverridesChange,
  onClose,
}: CategoryProductsModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-brand-50 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{siteLabel}</p>
            <h2 id="category-modal-title" className="text-lg font-bold text-brand-900">
              {title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {products.length.toLocaleString("fr-FR")} produit{products.length > 1 ? "s" : ""} — triés
              par avis. Cliquez « Réaffecter » pour corriger un produit mal classé.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800"
            aria-label="Fermer la fenêtre"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Aucun produit dans cette catégorie.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard
                  key={product.parent_key ?? product.product_url}
                  site={product.site}
                  name={`${index + 1}. ${product.product_name}`}
                  url={product.product_url}
                  imageUrl={product.image_url ?? guessProductImageUrl(product.site, product.product_url)}
                  priceText={product.price_text}
                  reviewCount={product.review_count ?? 0}
                  variantCount={product.variant_count}
                  actions={
                    <ProductAssignControls
                      product={product}
                      overrides={overrides}
                      onAssign={(macroId, subId) => {
                        onOverridesChange(
                          assignProduct(overrides, product.site, product.product_url, macroId, subId),
                        );
                      }}
                      onClear={() => {
                        onOverridesChange(clearProductAssignment(overrides, product.site, product.product_url));
                      }}
                    />
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
