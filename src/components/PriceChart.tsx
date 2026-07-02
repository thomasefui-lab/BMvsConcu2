"use client";

import type { PriceHistoryPoint } from "@/lib/types";
import { formatCentsAsEuros } from "@/lib/price-analytics";
import { formatOfferUpdateDateShort } from "@/lib/dates";

interface PriceChartProps {
  series: PriceHistoryPoint[];
  height?: number;
}

export function PriceChart({ series, height = 280 }: PriceChartProps) {
  if (!series.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
        Aucune donnée prix pour ces filtres.
      </div>
    );
  }

  const width = 800;
  const pad = { top: 24, right: 24, bottom: 48, left: 72 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const values = series.map((p) => p.avg_cents);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = Math.max(maxV - minV, 1);

  const points = series.map((p, i) => {
    const x = pad.left + (i / Math.max(series.length - 1, 1)) * innerW;
    const y = pad.top + innerH - ((p.avg_cents - minV) / span) * innerH;
    return { x, y, p };
  });

  const polyline = points.map((pt) => `${pt.x},${pt.y}`).join(" ");

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]" role="img">
        <title>Évolution du prix moyen</title>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.top + innerH * (1 - t);
          const val = minV + span * t;
          return (
            <g key={t}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                {formatCentsAsEuros(Math.round(val))}
              </text>
            </g>
          );
        })}
        <polyline
          fill="none"
          stroke="#1e40af"
          strokeWidth="2.5"
          strokeLinejoin="round"
          points={polyline}
        />
        {points.map((pt) => (
          <g key={pt.p.scrape_day}>
            <circle cx={pt.x} cy={pt.y} r="4" fill="#1e40af" />
            <title>
              {formatOfferUpdateDateShort(`${pt.p.scrape_day}T12:00:00.000Z`)} —{" "}
              {formatCentsAsEuros(pt.p.avg_cents)} ({pt.p.sample_count} obs.
              {pt.p.excluded_outliers > 0 ? `, ${pt.p.excluded_outliers} outliers exclus` : ""})
            </title>
          </g>
        ))}
        {points.map((pt, i) =>
          i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1 ? (
            <text
              key={`${pt.p.scrape_day}-label`}
              x={pt.x}
              y={height - 12}
              textAnchor="middle"
              className="fill-slate-500 text-[9px]"
            >
              {formatOfferUpdateDateShort(`${pt.p.scrape_day}T12:00:00.000Z`)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
