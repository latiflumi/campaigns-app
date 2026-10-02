// app/layout.tsx
import Link from 'next/link'
import './globals.css'
import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { getSession } from './lib/session'
import { prisma } from './lib/prisma'
import { avatarUrl } from './lib/avatar'
import UserMenu from './UserMenu'
import PresencePing from './PresencePing'
import NotificationBell from './NotificationBell'
import { touchPresence } from './lib/presence'
import ThemeToggle from './ThemeToggle'
import AppToaster from './AppToaster'
import LanguageToggle from './LanguageToggle'
import { I18nProvider } from './lib/i18n/client'
import { getLocale } from './lib/i18n/server'
import { dictionaries } from './lib/i18n/dictionaries'
import AppMark from './AppMark'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

// The app has no name yet: tabs show the page ("Kampanjat"), or the company on pages without a title
export const metadata: Metadata = {
  title: { default: 'A&M Clothes', template: '%s · A&M' },
  description: 'Campaigns, sales and stock for A&M Clothes',
}

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
  const locale = await getLocale();
  const t = dictionaries[locale];

  // Name + avatar for the header circle (never selects the image bytes themselves)
  const me = showHeader
    ? await prisma.user.findUnique({
        where: { userId: session.userId },
        select: { fullName: true, avatarUpdatedAt: true, role: true },
      })
    : null;
  const displayName = me?.fullName || session?.userName || '';
  const avatarSrc = session && me?.avatarUpdatedAt ? avatarUrl(session.userId, me.avatarUpdatedAt) : null;
  const isAdmin = me?.role === 'ADMIN'; // admins get the Users page in the avatar menu

  // Presence: mark this user as seen (at most one write a minute; never blocks or breaks the page)
  if (showHeader) touchPresence(session.userId).catch(() => {});

  // Unread notifications for the bell (the bell refreshes the count itself afterwards)
  const unread = showHeader ? await prisma.notification.count({ where: { userId: session.userId, readAt: null } }).catch(() => 0) : 0;

  return (
    <html lang={locale} className={roboto.variable} data-theme={theme} suppressHydrationWarning>
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 min-h-screen">
        <I18nProvider locale={locale}>
        {/* Render Header ONLY when authenticated and not on /login */}
        {showHeader && (
          <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 text-neutral-900 shadow-sm backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3 sm:gap-8">
                  <Link href="/" aria-label="A&M Clothes" className="rounded-lg focus-visible:outline-2 focus-visible:outline-brand-500">
                    <AppMark className="size-8" />
                  </Link>
                  <nav className="flex items-center gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    {[
                      { href: '/campaigns', label: t.nav.campaigns },
                      { href: '/bi', label: t.nav.bi },
                    ].map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={`px-3 py-2 rounded-md transition-colors ${active ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500 dark:text-white' :'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white'}`}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
                <div className="flex items-center gap-3">
                  <LanguageToggle className="hidden sm:inline-flex" />
                  <NotificationBell initialUnread={unread} />
                  <ThemeToggle className="text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white" />
                  <UserMenu name={displayName} userName={session.userName} avatarSrc={avatarSrc} isAdmin={isAdmin} />
                  <PresencePing />
                </div>
              </div>
            </div>
          </header>
        )}

        {/* No header (login): keep the toggle reachable in the corner */}
        {!showHeader && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <LanguageToggle className="border border-neutral-200 shadow-sm dark:border-neutral-800" />
            <ThemeToggle className="border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-white" />
          </div>
        )}

        <main className="p-6 min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased">
          <AppToaster initialTheme={theme ?? 'system'} />
          {children}
        </main>
        </I18nProvider>
      </body>
    </html>
  )
}
