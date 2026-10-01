"use client"

// app/ProductThumb.tsx
// Product photo thumbnail (3:4) from the stock app's image server, resized by Next. When there is no
// image (no colour code in the ERP, or the server answers 404) it shows a quiet placeholder tile.
// Zoom: with a mouse, hovering shows a larger photo next to the cursor (click still opens the full
// photo); on touch screens a tap opens the photo enlarged over the page, and a tap anywhere closes it.
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { motion } from "motion/react"
import { ExternalLink, Shirt } from "lucide-react"
import { productImageUrl } from "@/app/lib/productImages"
import { useT } from "@/app/lib/i18n/client"

interface Props {
  styleNumber: string | number | null | undefined
  colorCode: string | null | undefined
  alt: string
  /** Width in px; height is 4/3 of it */
  width?: number
  className?: string
}

// Size of the hover preview (3:4, like the thumbnails)
const PREVIEW_W = 240
const PREVIEW_H = 320
const GAP = 18

/** Top-left of the hover preview: right of the cursor, flipped left near the edge, kept on screen. */
function previewPosition(x: number, y: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = x + GAP + PREVIEW_W > vw - 8 ? x - GAP - PREVIEW_W : x + GAP
  const top = Math.min(Math.max(8, y - PREVIEW_H / 2), vh - PREVIEW_H - 8)
  return { left: Math.max(8, left), top }
}

export default function ProductThumb({ styleNumber, colorCode, alt, width = 36, className = "" }: Props) {
  const t = useT()
  const src = productImageUrl(styleNumber, colorCode)
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading")
  const [hover, setHover] = useState<{ left: number; top: number } | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const [lastPointer, setLastPointer] = useState<string>("mouse")
  const height = Math.round((width * 4) / 3)
  const box = `relative shrink-0 overflow-hidden rounded-lg ring-1 ring-neutral-200/80 dark:ring-neutral-700/80 ${className}`

  // Close the tap zoom with Escape too
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoomed(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [zoomed])

  if (!src || state === "failed") {
    return (
      <span
        className={`${box} grid place-items-center bg-linear-to-br from-neutral-50 to-neutral-100 text-neutral-300 dark:from-neutral-800 dark:to-neutral-800/40 dark:text-neutral-600`}
        style={{ width, height }}
        role="img"
        aria-label={t.product.noImageFor(alt)}
        title={t.product.noImage}
      >
        <Shirt className="size-[45%]" strokeWidth={1.5} aria-hidden />
      </span>
    )
  }

  const onPointer = (e: React.PointerEvent) => {
    setLastPointer(e.pointerType)
    if (e.pointerType === "mouse" && state === "loaded") setHover(previewPosition(e.clientX, e.clientY))
  }

  return (
    <>
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        aria-label={`${alt} · ${t.product.openPhoto}`}
        className={`${box} block cursor-zoom-in bg-neutral-100 dark:bg-neutral-800 ${state === "loading" ? "animate-pulse" : ""}`}
        style={{ width, height }}
        onPointerEnter={onPointer}
        onPointerMove={onPointer}
        onPointerLeave={() => setHover(null)}
        onPointerDown={(e) => setLastPointer(e.pointerType)}
        onClick={(e) => {
          // Touch: zoom in place instead of leaving the app; mouse keeps opening the full photo
          if (lastPointer !== "mouse") {
            e.preventDefault()
            setZoomed(true)
          }
          setHover(null)
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={`${width}px`}
          className="size-full object-cover"
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
        />
      </a>

      {/* Rendered into <body> so scrolling lists and cards can't clip it */}
      {hover &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none fixed z-[100] overflow-hidden rounded-2xl bg-neutral-100 shadow-2xl ring-1 ring-black/10 dark:bg-neutral-800 dark:ring-white/10"
            style={{ left: hover.left, top: hover.top, width: PREVIEW_W, height: PREVIEW_H }}
            aria-hidden
          >
            <Image src={src} alt="" width={PREVIEW_W} height={PREVIEW_H} sizes={`${PREVIEW_W}px`} className="size-full object-cover" />
          </motion.div>,
          document.body,
        )}

      {zoomed &&
        createPortal(
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => setZoomed(false)}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/70 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
              className="relative aspect-[3/4] w-[min(80vw,24rem)] overflow-hidden rounded-2xl bg-neutral-800 shadow-2xl"
            >
              <Image src={src} alt={alt} fill sizes="(max-width: 480px) 80vw, 384px" className="object-cover" />
            </motion.div>
            <p className="max-w-[min(80vw,24rem)] truncate text-center text-sm font-medium text-white">{alt}</p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <ExternalLink className="size-3.5" />
              {t.product.openPhoto}
            </a>
          </motion.div>,
          document.body,
        )}
    </>
  )
}
