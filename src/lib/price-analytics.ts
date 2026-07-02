/** Filtre les prix aberrants (erreurs de scraping) via IQR. */
export function filterPriceOutliers(cents: number[]): number[] {
  const valid = cents.filter((c) => c > 0);
  if (valid.length < 4) return valid;

  const sorted = [...valid].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const low = Math.max(0, q1 - 1.5 * iqr);
  const high = q3 + 1.5 * iqr;
  return valid.filter((c) => c >= low && c <= high);
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function formatCentsAsEuros(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export interface RawPriceObservation {
  scrape_day: string;
  price_cents: number;
}

/** Agrège des observations prix par jour avec exclusion des outliers. */
export function aggregatePriceByDay(
  observations: RawPriceObservation[],
): { scrape_day: string; avg_cents: number; median_cents: number; sample_count: number; excluded_outliers: number }[] {
  const byDay = new Map<string, number[]>();
  for (const obs of observations) {
    if (obs.price_cents <= 0) continue;
    const bucket = byDay.get(obs.scrape_day) ?? [];
    bucket.push(obs.price_cents);
    byDay.set(obs.scrape_day, bucket);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([scrape_day, prices]) => {
      const filtered = filterPriceOutliers(prices);
      const avg =
        filtered.length > 0
          ? Math.round(filtered.reduce((sum, p) => sum + p, 0) / filtered.length)
          : 0;
      return {
        scrape_day,
        avg_cents: avg,
        median_cents: Math.round(median(filtered)),
        sample_count: filtered.length,
        excluded_outliers: prices.length - filtered.length,
      };
    })
    .filter((row) => row.sample_count > 0);
}
