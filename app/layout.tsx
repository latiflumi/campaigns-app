// app/layout.tsx
import Link from 'next/link'
import './globals.css'
import { Roboto } from 'next/font/google'
import { Toaster } from 'sonner'
import { headers } from 'next/headers'
import { getSession } from './lib/session'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession();
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';
  const isLoginPage = pathname === '/login';


  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen">
        {/* Render Header ONLY when authenticated and not on /login */}
        {!isLoginPage && session && (
          <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wide text-white">
                    <span className="bg-blue-600 text-xs px-2 py-1 rounded font-mono uppercase">App</span>
                    <span>CampaignStudio</span>
                  </Link>
                  <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
                    <Link href="/campaigns" className="px-3 py-2 rounded-md hover:text-white hover:bg-slate-800 transition-colors">
                      Campaigns
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/campaigns/new"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-md transition-colors"
                  >
                    + New
                  </Link>
                  <Link 
                    href="/profile" 
                    className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 hover:border-slate-400 transition-colors"
                  >
                      {session.userName ? session.userName.charAt(0).toUpperCase() : ''}
                  </Link>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="p-6 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
          <Toaster position="top-right" richColors closeButton />
          {children}
        </main>
      </body>
    </html>
  )
}