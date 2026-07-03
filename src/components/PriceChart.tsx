"use client";

import type { PriceHistoryPoint, SiteId } from "@/lib/types";
import { SITE_CHART_COLORS } from "@/lib/types";
import {
  formatCentsAsEuros,
  priceChartMaxCents,
  priceChartTickCents,
} from "@/lib/price-analytics";
import { formatOfferUpdateDateShort } from "@/lib/dates";

export interface PriceChartSeries {
  site: SiteId;
  label: string;
  color: string;
  points: PriceHistoryPoint[];
}

interface PriceChartProps {
  series: PriceChartSeries[];
  height?: number;
}

export function PriceChart({ series, height = 360 }: PriceChartProps) {
  const active = series.filter((s) => s.points.length > 0);
  if (!active.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
        Aucune donnée prix pour ces filtres.
      </div>
    );
  }

  const width = 900;
  const pad = { top: 16, right: 20, bottom: 40, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const allDays = [...new Set(active.flatMap((s) => s.points.map((p) => p.scrape_day)))].sort();
  const allValues = active.flatMap((s) => s.points.map((p) => p.avg_cents));
  const maxY = priceChartMaxCents(allValues);
  const ticks = priceChartTickCents(maxY);

  const dayIndex = (day: string) => allDays.indexOf(day);

  const toPoint = (day: string, cents: number) => {
    const i = dayIndex(day);
    const x = pad.left + (i / Math.max(allDays.length - 1, 1)) * innerW;
    const y = pad.top + innerH - (cents / maxY) * innerH;
    return { x, y };
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      {active.length > 1 ? (
        <div className="mb-2 flex flex-wrap gap-3 px-1">
          {active.map((s) => (
            <span key={s.site} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[640px]" role="img">
          <title>Évolution du prix moyen</title>
          {ticks.map((val) => {
            const y = pad.top + innerH - (val / maxY) * innerH;
            return (
              <g key={val}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={val === 250_000 ? "0" : "4 4"}
                />
                <text x={pad.left - 6} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">
                  {formatCentsAsEuros(val)}
                </text>
              </g>
            );
          })}
          {active.map((s) => {
            const pts = s.points
              .map((p) => ({ p, ...toPoint(p.scrape_day, p.avg_cents) }))
              .sort((a, b) => a.p.scrape_day.localeCompare(b.p.scrape_day));
            const polyline = pts.map((pt) => `${pt.x},${pt.y}`).join(" ");
            return (
              <g key={s.site}>
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  points={polyline}
                />
                {pts.map((pt) => (
                  <circle key={pt.p.scrape_day} cx={pt.x} cy={pt.y} r="3" fill={s.color}>
                    <title>
                      {s.label} — {formatOfferUpdateDateShort(`${pt.p.scrape_day}T12:00:00.000Z`)} —{" "}
                      {formatCentsAsEuros(pt.p.avg_cents)} ({pt.p.sample_count} obs.
                      {pt.p.excluded_outliers > 0 ? `, ${pt.p.excluded_outliers} outliers exclus` : ""})
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}
          {allDays.map((day, i) =>
            i % Math.max(1, Math.floor(allDays.length / 8)) === 0 || i === allDays.length - 1 ? (
              <text
                key={day}
                x={pad.left + (i / Math.max(allDays.length - 1, 1)) * innerW}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-500 text-[8px]"
              >
                {formatOfferUpdateDateShort(`${day}T12:00:00.000Z`)}
              </text>
            ) : null,
          )}
        </svg>
      </div>
    </div>
  );
}

export function buildChartSeries(
  bySite: Partial<Record<SiteId, PriceHistoryPoint[]>>,
  labels: Record<SiteId, string>,
): PriceChartSeries[] {
  return (Object.entries(bySite) as [SiteId, PriceHistoryPoint[]][])
    .filter(([, points]) => points.length > 0)
    .map(([site, points]) => ({
      site,
      label: labels[site] ?? site,
      color: SITE_CHART_COLORS[site],
      points,
    }));
}
