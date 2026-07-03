"use client";

import { useMemo, useState } from "react";
import type { PriceHistoryPoint, SiteId } from "@/lib/types";
import { SITE_CHART_COLORS } from "@/lib/types";
import {
  formatCentsAsEuros,
  PRICE_CHART_BASE_MAX_CENTS,
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

interface HoverState {
  day: string;
  x: number;
  clientX: number;
  clientY: number;
}

export function PriceChart({ series, height = 360 }: PriceChartProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const active = series.filter((s) => s.points.length > 0);
  const width = 900;
  const pad = { top: 16, right: 20, bottom: 40, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const allDays = useMemo(
    () => [...new Set(active.flatMap((s) => s.points.map((p) => p.scrape_day)))].sort(),
    [active],
  );
  const allValues = useMemo(
    () => active.flatMap((s) => s.points.map((p) => p.avg_cents)),
    [active],
  );
  const maxY = priceChartMaxCents(allValues);
  const ticks = priceChartTickCents(maxY);

  const dayIndex = (day: string) => allDays.indexOf(day);

  const toPoint = (day: string, cents: number) => {
    const i = dayIndex(day);
    const x = pad.left + (i / Math.max(allDays.length - 1, 1)) * innerW;
    const y = pad.top + innerH - (cents / maxY) * innerH;
    return { x, y };
  };

  const snapDayFromSvgX = (svgX: number): { day: string; x: number } | null => {
    if (svgX < pad.left || svgX > width - pad.right || !allDays.length) return null;
    const ratio = (svgX - pad.left) / innerW;
    const idx = Math.round(ratio * Math.max(allDays.length - 1, 0));
    const clamped = Math.min(Math.max(idx, 0), allDays.length - 1);
    const day = allDays[clamped];
    return { day, x: toPoint(day, 0).x };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;
    const snapped = snapDayFromSvgX(svgX);
    if (!snapped) {
      setHover(null);
      return;
    }
    setHover({
      day: snapped.day,
      x: snapped.x,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };

  const hoverRows = useMemo(() => {
    if (!hover) return [];
    return active
      .map((s) => {
        const pt = s.points.find((p) => p.scrape_day === hover.day);
        if (!pt) return null;
        return { label: s.label, color: s.color, cents: pt.avg_cents, point: pt };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [active, hover]);

  if (!active.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
        Aucune donnée prix pour ces filtres.
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-2">
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
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[640px] cursor-crosshair"
          role="img"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        >
          <title>Évolution du prix moyen</title>
          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            pointerEvents="all"
          />
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
                  strokeDasharray={val === PRICE_CHART_BASE_MAX_CENTS ? "0" : "4 4"}
                />
                <text x={pad.left - 6} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">
                  {formatCentsAsEuros(val)}
                </text>
              </g>
            );
          })}
          {hover ? (
            <line
              x1={hover.x}
              y1={pad.top}
              x2={hover.x}
              y2={pad.top + innerH}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
              pointerEvents="none"
            />
          ) : null}
          {active.map((s) => {
            const pts = s.points
              .map((p) => ({ p, ...toPoint(p.scrape_day, p.avg_cents) }))
              .sort((a, b) => a.p.scrape_day.localeCompare(b.p.scrape_day));
            const polyline = pts.map((pt) => `${pt.x},${pt.y}`).join(" ");
            return (
              <g key={s.site} pointerEvents="none">
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  points={polyline}
                />
                {pts.map((pt) => (
                  <circle
                    key={pt.p.scrape_day}
                    cx={pt.x}
                    cy={pt.y}
                    r={hover?.day === pt.p.scrape_day ? 5 : 3}
                    fill={s.color}
                    stroke={hover?.day === pt.p.scrape_day ? "#fff" : "none"}
                    strokeWidth={hover?.day === pt.p.scrape_day ? 1.5 : 0}
                  />
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
                pointerEvents="none"
              >
                {formatOfferUpdateDateShort(`${day}T12:00:00.000Z`)}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {hover && hoverRows.length > 0 ? (
        <div
          className="pointer-events-none fixed z-50 min-w-[140px] rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-lg"
          style={{ left: hover.clientX + 14, top: hover.clientY - 12 }}
        >
          <p className="mb-1.5 font-semibold text-slate-800">
            {formatOfferUpdateDateShort(`${hover.day}T12:00:00.000Z`)}
          </p>
          <ul className="space-y-1">
            {hoverRows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  {row.label}
                </span>
                <span className="font-medium tabular-nums text-slate-900">
                  {formatCentsAsEuros(row.cents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
