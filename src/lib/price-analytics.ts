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
  site: string;
  scrape_day: string;
  price_cents: number;
}

export type PriceDayAggregate = {
  scrape_day: string;
  avg_cents: number;
  median_cents: number;
  sample_count: number;
  excluded_outliers: number;
};

/** Agrège des observations prix par jour avec exclusion des outliers. */
export function aggregatePriceByDay(observations: RawPriceObservation[]): PriceDayAggregate[] {
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

/** Agrège par acteur puis par jour (une courbe par site). */
export function aggregatePriceBySiteAndDay(
  observations: RawPriceObservation[],
  sites: string[],
): Record<string, PriceDayAggregate[]> {
  const result: Record<string, PriceDayAggregate[]> = {};
  for (const site of sites) {
    const siteObs = observations.filter((o) => o.site === site);
    const series = aggregatePriceByDay(siteObs);
    if (series.length) result[site] = series;
  }
  return result;
}

/** Échelle Y fixe pour comparer les acteurs : 0 € → 500 €, plafond relevé par paliers de 250 €. */
export const PRICE_CHART_BASE_MAX_CENTS = 50_000;
export const PRICE_CHART_STEP_CENTS = 25_000;

export function priceChartMaxCents(values: number[]): number {
  const dataMax = values.length ? Math.max(...values) : 0;
  if (dataMax <= PRICE_CHART_BASE_MAX_CENTS) return PRICE_CHART_BASE_MAX_CENTS;
  return Math.ceil(dataMax / PRICE_CHART_STEP_CENTS) * PRICE_CHART_STEP_CENTS;
}

export function priceChartTickCents(maxCents: number): number[] {
  const ticks: number[] = [];
  for (let v = 0; v <= maxCents; v += PRICE_CHART_STEP_CENTS) ticks.push(v);
  if (ticks[ticks.length - 1] !== maxCents) ticks.push(maxCents);
  return ticks;
}
