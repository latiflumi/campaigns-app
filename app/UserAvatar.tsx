// app/UserAvatar.tsx
// The photo when the user has one, otherwise one capital letter. No hooks, so it
// renders on the server (header) and the client (profile page) alike.

import { avatarLetter } from "./lib/avatar"

export default function UserAvatar({
  name,
  src,
  className = "",
}: {
  /** Display name: full name, or the username when no full name is set */
  name: string
  src: string | null
  className?: string
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served from our own authenticated route; next/image's optimizer can't forward the session cookie
      <img src={src} alt={name} className={`rounded-full object-cover ${className}`} />
    )
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex items-center justify-center rounded-full bg-brand-700 font-bold text-white select-none ${className}`}
    >
      {avatarLetter(name)}
    </span>
  )
}
