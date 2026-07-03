"use client";

import { useMemo, useState } from "react";
import type { PriceHistoryPoint, ProductRow, SiteId } from "@/lib/types";
import { COMPETITORS } from "@/lib/types";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { buildChartSeries, PriceChart } from "./PriceChart";

interface PriceEvolutionPanelProps {
  products: ProductRow[];
}

export function PriceEvolutionPanel({ products }: PriceEvolutionPanelProps) {
  const [selectedSites, setSelectedSites] = useState<SiteId[]>(["bestmobilier"]);
  const [allProducts, setAllProducts] = useState(true);
  const [showProductList, setShowProductList] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [bySite, setBySite] = useState<Partial<Record<SiteId, PriceHistoryPoint[]>>>({});
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

  const siteLabels = useMemo(
    () => Object.fromEntries(COMPETITORS.map((c) => [c.id, c.label])) as Record<SiteId, string>,
    [],
  );

  const chartSeries = useMemo(() => buildChartSeries(bySite, siteLabels), [bySite, siteLabels]);

  const totalOutliers = useMemo(
    () =>
      Object.values(bySite)
        .flat()
        .reduce((sum, p) => sum + p.excluded_outliers, 0),
    [bySite],
  );

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
      const body = (await res.json()) as {
        bySite: Partial<Record<SiteId, PriceHistoryPoint[]>>;
      };
      setBySite(body.bySite ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setBySite({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-xs text-slate-500">
          Prix moyen par date de scrape (IQR). Échelle fixe 0–1 000 € pour comparer les acteurs.
        </p>

        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {COMPETITORS.map((c) => (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center rounded-full px-2.5 py-1 text-xs ring-1 ${
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

          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={allProducts}
              onChange={(e) => {
                setAllProducts(e.target.checked);
                if (e.target.checked) setSelectedUrls([]);
              }}
            />
            Tous les produits (moyenne par acteur)
          </label>

          {!allProducts ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400">
                  {selectedUrls.length} produit{selectedUrls.length > 1 ? "s" : ""} sélectionné
                  {selectedUrls.length > 1 ? "s" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setShowProductList((prev) => !prev)}
                  className="rounded border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  {showProductList ? "Masquer la liste produits" : "Afficher la liste produits"}
                </button>
              </div>
              {showProductList ? (
                <>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un produit…"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                  <div className="max-h-36 overflow-y-auto rounded-md border border-slate-200">
                    {filteredOptions.map((p) => (
                      <label
                        key={p.product_url}
                        className="flex cursor-pointer items-start gap-2 border-b border-slate-100 px-2.5 py-1.5 text-xs last:border-0 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUrls.includes(p.product_url)}
                          onChange={() => toggleProduct(p.product_url)}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium text-slate-800">{p.product_name}</span>
                          <span className="mt-0.5 block text-[10px] text-slate-400">{p.site}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={loadChart}
            disabled={loading || !selectedSites.length || (!allProducts && !selectedUrls.length)}
            className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? "Calcul…" : "Afficher la courbe"}
          </button>
        </div>

        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner label="Construction de la courbe…" />
        </div>
      ) : null}

      {!loading && hasLoaded ? (
        <>
          <PriceChart series={chartSeries} />
          {chartSeries.length > 0 ? (
            <p className="text-center text-[10px] text-slate-400">
              {chartSeries.length} acteur{chartSeries.length > 1 ? "s" : ""} ·{" "}
              {totalOutliers > 0 ? `${totalOutliers} outliers exclus` : "aucun outlier"}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
