"use client"

// app/ProductThumb.tsx
// Product photo thumbnail (3:4) from the stock app's image server, resized by Next. When there is no
// image (no colour code in the ERP, or the server answers 404) it shows a quiet placeholder tile.
import { useState } from "react"
import Image from "next/image"
import { Shirt } from "lucide-react"
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

export default function ProductThumb({ styleNumber, colorCode, alt, width = 36, className = "" }: Props) {
  const t = useT()
  const src = productImageUrl(styleNumber, colorCode)
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading")
  const height = Math.round((width * 4) / 3)
  const box = `relative shrink-0 overflow-hidden rounded-lg ring-1 ring-neutral-200/80 dark:ring-neutral-700/80 ${className}`

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

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      title={t.product.openPhoto}
      className={`${box} block bg-neutral-100 dark:bg-neutral-800 ${state === "loading" ? "animate-pulse" : ""}`}
      style={{ width, height }}
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
  )
}
