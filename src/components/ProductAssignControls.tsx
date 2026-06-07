"use client";

import { useState } from "react";
import { TAXONOMY } from "@/lib/taxonomy";
import type { ProductRow } from "@/lib/types";
import {
  getEffectiveClassification,
  getMacroLabel,
  getSubcategoryLabel,
  productOverrideKey,
  type TaxonomyOverrides,
} from "@/lib/classification-overrides";

interface ProductAssignControlsProps {
  product: ProductRow;
  overrides: TaxonomyOverrides;
  onAssign: (macroId: string, subId: string) => void;
  onClear: () => void;
}

export function ProductAssignControls({
  product,
  overrides,
  onAssign,
  onClear,
}: ProductAssignControlsProps) {
  const [open, setOpen] = useState(false);
  const effective = getEffectiveClassification(product, overrides);
  const isManual = Boolean(overrides.productAssignments[productOverrideKey(product.site, product.product_url)]);

  const [macroId, setMacroId] = useState(effective.macroId);
  const [subId, setSubId] = useState(effective.subId);

  const macro = TAXONOMY.find((m) => m.id === macroId);
  const subs = macro?.subcategories ?? [];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
          isManual
            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
            : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
        }`}
        title="Réaffecter ce produit"
      >
        {isManual ? "Réaffecté" : "Réaffecter"}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-[10px] font-medium text-slate-500">Catégorie actuelle</p>
          <p className="mb-3 text-xs text-brand-800">
            {getMacroLabel(effective.macroId)} — {getSubcategoryLabel(effective.subId)}
          </p>

          <label className="mb-1 block text-[10px] font-medium text-slate-500">Catégorie</label>
          <select
            value={macroId}
            onChange={(e) => {
              const nextMacro = e.target.value;
              setMacroId(nextMacro);
              const firstSub = TAXONOMY.find((m) => m.id === nextMacro)?.subcategories[0]?.id;
              if (firstSub) setSubId(firstSub);
            }}
            className="mb-2 w-full rounded border border-slate-200 px-2 py-1 text-xs"
          >
            {TAXONOMY.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-[10px] font-medium text-slate-500">Sous-catégorie</label>
          <select
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            className="mb-3 w-full rounded border border-slate-200 px-2 py-1 text-xs"
          >
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onAssign(macroId, subId);
                setOpen(false);
              }}
              className="flex-1 rounded bg-brand-700 px-2 py-1 text-xs font-medium text-white hover:bg-brand-800"
            >
              Enregistrer
            </button>
            {isManual ? (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Auto
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
