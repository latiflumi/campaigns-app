// app/AppMark.tsx
// The app's logo mark ("Stack" in the Black gold colours): an isometric stack on a black stone tile,
// a solid gold top layer over two outlined layers. Stores, products and stock in one view.
// Same drawing as app/icon.svg. No hooks, so it renders on the server and the client alike.

export default function AppMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="app-mark-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c1917" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="url(#app-mark-tile)" stroke="#44403c" />
      <path d="M16 7 25 11.5 16 16 7 11.5Z" fill="#fde68a" />
      <path d="M7 15.6 16 20.1 25 15.6" fill="none" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 19.8 16 24.3 25 19.8" fill="none" stroke="#fbbf24" strokeOpacity=".6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
