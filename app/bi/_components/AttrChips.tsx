// app/bi/_components/AttrChips.tsx
// Product attribute chips, shared by server sections and client lists (no hooks).
import type { BiItemAttributes } from "@/app/lib/bi/types"
import { genderLabel, seasonText } from "@/app/lib/bi/attributes"
import type { Dict } from "@/app/lib/i18n/dictionaries"
import { cx } from "./ui"

/** "Black · XL · Men · NOOS" as small chips; NOOS is highlighted because it never runs out by design. */
export default function AttrChips({ item, t }: { item: BiItemAttributes; t: Dict }) {
  // Keyed by attribute, not by text: colour and size can carry the same value (e.g. "ONE SIZE")
  const parts = [
    { key: "color", text: item.color },
    { key: "size", text: item.size },
    { key: "gender", text: genderLabel(item.gender, t) },
  ].filter((p): p is { key: string; text: string } => Boolean(p.text))
  const season = seasonText(item.season, t)
  if (!parts.length && !season) return null
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {parts.map((p) => (
        <span key={p.key} className="max-w-40 truncate rounded-md bg-neutral-100 px-1.5 py-px text-[10.5px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {p.text}
        </span>
      ))}
      {season && (
        <span
          className={cx(
            "rounded-md px-1.5 py-px text-[10.5px] font-semibold",
            season === "NOOS"
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
              : "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
          )}
        >
          {season}
        </span>
      )}
    </span>
  )
}
