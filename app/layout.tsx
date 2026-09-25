// app/layout.tsx
import Link from 'next/link'
import './globals.css'
import { Roboto } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { getSession } from './lib/session'
import { prisma } from './lib/prisma'
import { avatarUrl } from './lib/avatar'
import UserMenu from './UserMenu'
import ThemeToggle from './ThemeToggle'
import AppToaster from './AppToaster'

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

  // Saved light/dark choice from the header toggle; no cookie = follow the OS
  const saved = (await cookies()).get('theme')?.value;
  const theme = saved === 'dark' || saved === 'light' ? saved : undefined;
  const showHeader = !isLoginPage && session;

  // Name + avatar for the header circle (never selects the image bytes themselves)
  const me = showHeader
    ? await prisma.user.findUnique({
        where: { userId: session.userId },
        select: { fullName: true, avatarUpdatedAt: true, role: true },
      })
    : null;
  const displayName = me?.fullName || session?.userName || '';
  const avatarSrc = session && me?.avatarUpdatedAt ? avatarUrl(session.userId, me.avatarUpdatedAt) : null;
  const canManage = me?.role === 'ADMIN'; // viewers don't see "+ New"

  return (
    <html lang="en" className={roboto.variable} data-theme={theme} suppressHydrationWarning>
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 min-h-screen">
        {/* Render Header ONLY when authenticated and not on /login */}
        {showHeader && (
          <header className="sticky top-0 z-50 bg-neutral-900 text-white border-b border-neutral-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wide text-white">
                    <span className="bg-brand-600 text-white text-xs px-2 py-1 rounded font-mono uppercase">App</span>
                    <span>CampaignStudio</span>
                  </Link>
                  <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-neutral-300">
                    <Link href="/campaigns" className="px-3 py-2 rounded-md hover:text-white hover:bg-neutral-800 transition-colors">
                      Campaigns
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center gap-3">
                  {canManage && (
                    <Link
                      href="/campaigns/new"
                      className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-2 rounded-md transition-colors"
                    >
                      + New
                    </Link>
                  )}
                  <ThemeToggle className="text-neutral-300 hover:bg-neutral-800 hover:text-white" />
                  <UserMenu name={displayName} userName={session.userName} avatarSrc={avatarSrc} />
                </div>
              </div>
            </div>
          </header>
        )}

        {/* No header (login): keep the toggle reachable in the corner */}
        {!showHeader && (
          <ThemeToggle className="fixed top-4 right-4 z-50 border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-white" />
        )}

        <main className="p-6 min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased">
          <AppToaster initialTheme={theme ?? 'system'} />
          {children}
        </main>
      </body>
    </html>
  )
}
