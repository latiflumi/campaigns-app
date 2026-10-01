"use client"

// app/bi/_components/TrendChart.tsx
// Sales per day/week: this period (brand line + soft area) vs the comparison period (grey line).
import { useRef, useState } from "react"
import type { BiTimeseries } from "@/app/lib/bi/types"
import { formatRange } from "@/app/lib/bi/filters"
import { useT } from "@/app/lib/i18n/client"
import { formatDay, formatEurWhole } from "../../campaigns/_components/campaign-utils"
import { growth, signedPct } from "./ui"

const W = 720
const H = 220
const PAD = { l: 52, r: 12, t: 12, b: 26 }

const compact = (n: number) =>
  n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1).replace(".", ",")}M` : n >= 10_000 ? `€${Math.round(n / 1000)}k` : formatEurWhole(n)

export default function TrendChart({ data, compareLabel }: { data: BiTimeseries; compareLabel: string }) {
  const t = useT()
  const { points } = data
  const boxRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  if (points.length === 0) return <p className="px-5 py-10 text-center text-sm text-neutral-500">{t.bi.trend.noSales}</p>

  const max = Math.max(1, ...points.map((p) => Math.max(p.sales, p.previousSales))) * 1.08
  const innerW = W - PAD.l - PAD.r
  const x = (i: number) => PAD.l + (points.length === 1 ? innerW / 2 : (i * innerW) / (points.length - 1))
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
  const path = (key: "sales" | "previousSales") => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ")
  const area = `${path("sales")} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const ticks = [0, 0.5, 1].map((f) => (max / 1.08) * f)
  const every = Math.ceil(points.length / 7)
  const last = points.length - 1

  const onMove = (e: React.PointerEvent) => {
    const box = boxRef.current?.getBoundingClientRect()
    if (!box) return
    const vx = ((e.clientX - box.left) / box.width) * W
    const i = Math.round(((vx - PAD.l) / innerW) * (points.length - 1))
    setHover(Math.max(0, Math.min(last, i)))
  }

  const h = hover !== null ? points[hover] : null
  const hDelta = h ? growth(h.sales, h.previousSales) : null

  return (
    <div className="px-5 pt-3 pb-4">
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-3 rounded-full bg-brand-600 dark:bg-brand-400" />{t.bi.trend.thisPeriod}</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-1 w-3 rounded-full bg-neutral-400" />{compareLabel}</span>
      </div>
      <div ref={boxRef} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-none" role="img" aria-label={t.bi.trend.chartLabel}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-neutral-100 dark:stroke-neutral-800" strokeWidth="1" />
              <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize="10" className="fill-neutral-400">{compact(v)}</text>
            </g>
          ))}
          {points.map((p, i) =>
            i % every === 0 || i === last ? (
              <text key={p.bucketStart} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" className="fill-neutral-400">
                {formatDay(t, p.bucketStart)}
              </text>
            ) : null,
          )}
          <path d={area} className="fill-brand-500" opacity="0.08" />
          <path d={path("previousSales")} fill="none" className="stroke-neutral-400" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={path("sales")} fill="none" className="stroke-brand-600 dark:stroke-brand-400" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(last)} cy={y(points[last].sales)} r="4" className="fill-brand-600 stroke-white dark:fill-brand-400 dark:stroke-neutral-900" strokeWidth="2" />
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="stroke-neutral-300 dark:stroke-neutral-600" strokeWidth="1" />
              <circle cx={x(hover)} cy={y(points[hover].previousSales)} r="3.5" className="fill-neutral-400 stroke-white dark:stroke-neutral-900" strokeWidth="2" />
              <circle cx={x(hover)} cy={y(points[hover].sales)} r="4" className="fill-brand-600 stroke-white dark:fill-brand-400 dark:stroke-neutral-900" strokeWidth="2" />
            </g>
          )}
        </svg>
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg dark:bg-white dark:text-neutral-900"
            style={{ left: `${(x(hover) / W) * 100}%` }}
          >
            <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 tabular-nums">
              <span className="font-semibold">{formatRange(t, h.bucketStart, h.bucketEnd)}</span>
              <span className="text-right font-semibold">{formatEurWhole(h.sales)}</span>
              <span className="opacity-70">{h.previousStart ? formatRange(t, h.previousStart, h.previousEnd ?? h.previousStart) : t.bi.trend.noCompareDay}</span>
              <span className="text-right opacity-70">{formatEurWhole(h.previousSales)}</span>
            </div>
            {hDelta !== null && <div className="mt-1 text-right font-semibold tabular-nums">{signedPct(hDelta)}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
