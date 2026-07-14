"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/client";

export interface DayPoint {
  date: string; // ISO yyyy-mm-dd
  value: number;
}

// Single-series daily column chart (inline SVG).
// Marks follow the house viz spec: columns ≤24px with a 4px rounded data-end
// (square at the baseline), hairline solid gridlines, clean y-ticks, hover
// tooltip, and a direct label on the peak only. Single series → no legend.
export function DailyColumnChart({
  data,
  color,
  valueSuffix = "",
  title,
}: {
  data: DayPoint[];
  color: string;
  valueSuffix?: string;
  title: string;
}) {
  const { t } = useI18n();
  const [hover, setHover] = useState<number | null>(null);

  const W = 720;
  const H = 220;
  const PAD = { top: 16, right: 8, bottom: 24, left: 56 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const { max, ticks } = useMemo(() => {
    const rawMax = Math.max(1, ...data.map((d) => d.value));
    // round the axis max up to a clean number
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const nice = Math.ceil(rawMax / mag) * mag;
    const step = nice / 4;
    return { max: nice, ticks: [0, step, step * 2, step * 3, nice] };
  }, [data]);

  const n = data.length;
  const band = plotW / Math.max(1, n);
  const barW = Math.min(24, Math.max(4, band - 2)); // 2px surface gap between bars
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const peakIndex = useMemo(() => {
    let idx = 0;
    data.forEach((d, i) => {
      if (d.value > data[idx].value) idx = i;
    });
    return idx;
  }, [data]);

  const fmt = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : v >= 1000
        ? `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K`
        : String(Math.round(v));

  const dayLabel = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const hovered = hover != null ? data[hover] : null;

  return (
    <figure className="m-0">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={title}
          className="block w-full"
          onMouseLeave={() => setHover(null)}
        >
          {/* gridlines + y ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                className="stroke-zinc-200 dark:stroke-zinc-700"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={y(t) + 3.5}
                textAnchor="end"
                fontSize="11"
                className="fill-zinc-500 dark:fill-zinc-400"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fmt(t)}
              </text>
            </g>
          ))}

          {/* columns: 4px rounded top, square baseline (path, not rect rx) */}
          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const x0 = cx - barW / 2;
            const top = y(d.value);
            const base = PAD.top + plotH;
            const h = Math.max(0, base - top);
            const r = Math.min(4, h, barW / 2);
            const path =
              h === 0
                ? ""
                : `M ${x0} ${base}
                   L ${x0} ${top + r}
                   Q ${x0} ${top} ${x0 + r} ${top}
                   L ${x0 + barW - r} ${top}
                   Q ${x0 + barW} ${top} ${x0 + barW} ${top + r}
                   L ${x0 + barW} ${base} Z`;
            return (
              <g key={d.date}>
                {path && (
                  <path
                    d={path}
                    fill={color}
                    opacity={hover === null || hover === i ? 1 : 0.45}
                  />
                )}
                {/* hover hit target: full band height, wider than the mark */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                />
              </g>
            );
          })}

          {/* direct label on the peak only */}
          {data[peakIndex] && data[peakIndex].value > 0 && (
            <text
              x={PAD.left + band * peakIndex + band / 2}
              y={y(data[peakIndex].value) - 5}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              className="fill-zinc-700 dark:fill-zinc-200"
            >
              {fmt(data[peakIndex].value)}
              {valueSuffix}
            </text>
          )}

          {/* x labels: first, middle, last */}
          {[0, Math.floor(n / 2), n - 1]
            .filter((v, i, a) => n > 0 && a.indexOf(v) === i)
            .map((i) => (
              <text
                key={i}
                x={PAD.left + band * i + band / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize="11"
                className="fill-zinc-500 dark:fill-zinc-400"
              >
                {dayLabel(data[i].date)}
              </text>
            ))}
        </svg>

        {/* tooltip */}
        {hovered && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-800"
            style={{
              left: `${((PAD.left + band * hover! + band / 2) / W) * 100}%`,
              top: 0,
            }}
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{dayLabel(hovered.date)}</p>
            <p className="text-zinc-600 dark:text-zinc-300" style={{ fontVariantNumeric: "tabular-nums" }}>
              {hovered.value.toLocaleString("en-US")}
              {valueSuffix}
            </p>
          </div>
        )}
      </div>

      {/* accessible table fallback */}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
          {t("admin.overview.viewAsTable")}
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-start text-zinc-500">
                <th className="py-1 text-start font-medium">{t("admin.overview.date")}</th>
                <th className="py-1 text-end font-medium">{t("admin.overview.value")}</th>
              </tr>
            </thead>
            <tbody style={{ fontVariantNumeric: "tabular-nums" }}>
              {data.map((d) => (
                <tr key={d.date} className="border-t border-zinc-100">
                  <td className="py-1">{dayLabel(d.date)}</td>
                  <td className="py-1 text-end">
                    {d.value.toLocaleString("en-US")}
                    {valueSuffix}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
