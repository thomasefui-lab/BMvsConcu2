"use client";

import { useMemo, useState } from "react";
import type { PriceHistoryPoint, ProductRow, SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { PriceChart } from "./PriceChart";

interface PriceEvolutionPanelProps {
  products: ProductRow[];
}

export function PriceEvolutionPanel({ products }: PriceEvolutionPanelProps) {
  const [selectedSites, setSelectedSites] = useState<SiteId[]>(["bestmobilier"]);
  const [allProducts, setAllProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [series, setSeries] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const catalog = useMemo(() => {
    const siteSet = new Set(selectedSites);
    return products.filter((p) => siteSet.has(p.site));
  }, [products, selectedSites]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = catalog.filter((p) => {
      if (!q) return true;
      return (
        p.product_name.toLowerCase().includes(q) ||
        p.product_url.toLowerCase().includes(q) ||
        (p.collection_name?.toLowerCase().includes(q) ?? false)
      );
    });
    return list.slice(0, 80);
  }, [catalog, search]);

  const toggleSite = (site: SiteId) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site],
    );
  };

  const toggleProduct = (url: string) => {
    setAllProducts(false);
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  const loadChart = async () => {
    if (!selectedSites.length) return;
    setLoading(true);
    setError(null);
    setHasLoaded(true);
    try {
      const params = new URLSearchParams({ sites: selectedSites.join(",") });
      if (!allProducts && selectedUrls.length) {
        params.set("products", selectedUrls.join(","));
      }
      const res = await fetch(`/api/price-history?${params.toString()}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Erreur ${res.status}`);
      }
      const body = (await res.json()) as { series: PriceHistoryPoint[] };
      setSeries(body.series ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  const totalOutliers = series.reduce((sum, p) => sum + p.excluded_outliers, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-brand-900">Évolution des prix</h2>
        <p className="mt-1 text-sm text-slate-500">
          Prix moyen par date de scrape, hors valeurs aberrantes (filtre IQR). Sélectionnez un ou
          plusieurs acteurs et éventuellement des produits précis.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Acteurs
            </p>
            <div className="flex flex-wrap gap-2">
              {COMPETITORS.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ${
                    selectedSites.includes(c.id)
                      ? "bg-brand-700 text-white ring-brand-700"
                      : "bg-white text-slate-600 ring-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedSites.includes(c.id)}
                    onChange={() => toggleSite(c.id)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allProducts}
              onChange={(e) => {
                setAllProducts(e.target.checked);
                if (e.target.checked) setSelectedUrls([]);
              }}
            />
            Tous les produits des acteurs sélectionnés (moyenne globale)
          </label>

          {!allProducts ? (
            <div className="space-y-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit par nom ou URL…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                {filteredOptions.map((p) => (
                  <label
                    key={p.product_url}
                    className="flex cursor-pointer items-start gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-0 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUrls.includes(p.product_url)}
                      onChange={() => toggleProduct(p.product_url)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium text-slate-800">{p.product_name}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">{p.site}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {selectedUrls.length} produit{selectedUrls.length > 1 ? "s" : ""} sélectionné
                {selectedUrls.length > 1 ? "s" : ""}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={loadChart}
            disabled={loading || !selectedSites.length || (!allProducts && !selectedUrls.length)}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Calcul…
              </>
            ) : (
              "Afficher la courbe"
            )}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Construction de la courbe de prix…" />
        </div>
      ) : null}

      {!loading && hasLoaded ? (
        <>
          <PriceChart series={series} />
          {series.length > 0 ? (
            <p className="text-center text-xs text-slate-400">
              {series.length} dates de scrape · {totalOutliers > 0 ? `${totalOutliers} valeurs aberrantes exclues` : "aucun outlier détecté"}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
