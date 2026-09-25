// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  cookieOptions,
  signTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from './app/lib/tokens';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass current pathname via header for UI conditional rendering
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // 1. A valid access token: signed with our secret and not expired
  let user = await verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  let rotated: Awaited<ReturnType<typeof signTokens>> | null = null;

  // 2. Access token missing/expired: fall back to the refresh token and issue new ones.
  //    Rotation lives here because Server Components can't set cookies.
  if (!user) {
    user = await verifyRefreshToken(request.cookies.get(REFRESH_COOKIE)?.value);
    if (user) {
      rotated = await signTokens(user);
      // Let this same request's pages and actions see the fresh access token
      request.cookies.set(ACCESS_COOKIE, rotated.accessToken);
      request.cookies.set(REFRESH_COOKIE, rotated.refreshToken);
      requestHeaders.set('cookie', request.cookies.toString());
    }
  }

  // 3. Not signed in: only /login is reachable; drop any invalid cookies
  if (!user) {
    if (pathname === '/login') return NextResponse.next({ request: { headers: requestHeaders } });
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  // 4. Signed in and on /login: go to the app
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (rotated) {
    res.cookies.set(ACCESS_COOKIE, rotated.accessToken, cookieOptions(ACCESS_MAX_AGE));
    res.cookies.set(REFRESH_COOKIE, rotated.refreshToken, cookieOptions(REFRESH_MAX_AGE));
  }
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
