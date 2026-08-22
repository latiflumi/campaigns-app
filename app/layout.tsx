// app/layout.tsx
import Link from 'next/link'
import './globals.css'
import { Roboto } from 'next/font/google'
import { Toaster } from 'sonner'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Brand Logo */}
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wide text-white">
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded font-mono uppercase">App</span>
                  <span>CampaignStudio</span>
                </Link>

                {/* Primary Navigation */}
                <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
                  <Link href="/" className="px-3 py-2 rounded-md hover:text-white hover:bg-slate-800 transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/campaigns" className="px-3 py-2 rounded-md hover:text-white hover:bg-slate-800 transition-colors">
                    Campaigns
                  </Link>
                  <Link href="/analytics" className="px-3 py-2 rounded-md hover:text-white hover:bg-slate-800 transition-colors">
                    Analytics
                  </Link>
                  <Link href="/templates" className="px-3 py-2 rounded-md hover:text-white hover:bg-slate-800 transition-colors">
                    Templates
                  </Link>
                </nav>
              </div>

              {/* Quick Actions & Profile */}
              <div className="flex items-center gap-3">
                {/* Secondary Search / Quick Action */}
                <button 
                  type="button" 
                  className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md hover:border-slate-600 transition-colors"
                >
                  <span>Search campaigns...</span>
                  <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">⌘K</kbd>
                </button>

                {/* Create Campaign CTA */}
                <Link
                  href="/campaigns/new"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-md transition-colors"
                >
                  + New
                </Link>

                {/* Settings / User Avatar */}
                <Link 
                  href="/profile" 
                  className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 hover:border-slate-400 transition-colors"
                >
                  LL
                </Link>
              </div>

            </div>
          </div>
        </header>

        {/* Active Page Content */}
        <main className="p-6">
          <Toaster position="top-right" richColors closeButton />
          {children}
        </main>
      </body>
    </html>
  )
}