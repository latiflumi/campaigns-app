// app/lib/bi/brands.ts
// The ERP has no brand field, so the brand comes from the store name prefix
// ("JACK&JONES  Prishtina Mall" → "Jack & Jones", location "Prishtina Mall").

const PREFIXES: [prefix: string, brand: string][] = [
  ["A&M OUTLET", "A&M Outlet"],
  ["A&M CLOTHES", "A&M Clothes"],
  ["JACK&JONES", "Jack & Jones"],
  ["NAME IT", "Name It"],
  ["S.OLIVER", "s.Oliver"],
  ["VERO MODA", "Vero Moda"],
  ["ONLY", "Only"],
]

/** Collapses the ERP's double spaces: "A&M CLOTHES  Shesh" → "A&M CLOTHES Shesh". */
export const cleanName = (name: string) => name.replace(/\s+/g, " ").trim()

export function brandOf(name: string): string {
  const upper = cleanName(name).toUpperCase()
  return PREFIXES.find(([p]) => upper.startsWith(p))?.[1] ?? "Other"
}

/** The part after the brand: "A&M CLOTHES Shesh" → "Shesh". Falls back to the full name. */
export function locationOf(name: string): string {
  const clean = cleanName(name)
  const hit = PREFIXES.find(([p]) => clean.toUpperCase().startsWith(p))
  const rest = hit ? clean.slice(hit[0].length).trim() : ""
  return rest || clean
}

/** URL-safe key for the brand filter: "Jack & Jones" → "jack-jones". */
export const brandKey = (brand: string) => brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
