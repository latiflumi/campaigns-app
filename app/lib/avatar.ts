// app/lib/avatar.ts
// Shared by server and client code.

/** Versioned URL, so a new upload busts the browser's long-lived cache. */
export function avatarUrl(userId: string, updatedAt: string | Date) {
  return `/api/avatar/${userId}?v=${new Date(updatedAt).getTime()}`
}

/** The avatar fallback: one capital letter. "Latif Lumi" -> "L", "vanesa" -> "V" */
export function avatarLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

export const AVATAR_TYPES = ["image/webp", "image/jpeg", "image/png"] as const
/** Limit for the already-resized 256×256 image the browser uploads. */
export const AVATAR_MAX_BYTES = 300 * 1024
