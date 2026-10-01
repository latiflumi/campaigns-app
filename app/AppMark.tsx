// app/AppMark.tsx
// The app's logo mark ("Layers" in the Onyx pulse colours): three stacked bands on a dark stone tile,
// the top one lit. Stores, products and stock in one view. Same drawing as app/icon.svg.
// No hooks, so it renders on the server and the client alike.

export default function AppMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="app-mark-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#27272a" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      <rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="url(#app-mark-tile)" stroke="#3f3f46" />
      <rect x="8" y="9" width="16" height="3.4" rx="1.7" fill="#fda4af" />
      <rect x="10" y="14.3" width="14" height="3.4" rx="1.7" fill="#f43f5e" fillOpacity=".85" />
      <rect x="12" y="19.6" width="12" height="3.4" rx="1.7" fill="#f43f5e" fillOpacity=".55" />
    </svg>
  )
}
