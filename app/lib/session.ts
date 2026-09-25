import "server-only"
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    ACCESS_MAX_AGE,
    REFRESH_MAX_AGE,
    cookieOptions,
    signTokens,
    verifyAccessToken,
    verifyRefreshToken,
    type TokenPayLoad,
} from "./tokens";

export type { TokenPayLoad }

export async function setAuthCookies(payload: TokenPayLoad) {
    const cookieStore = await cookies()
    const { accessToken, refreshToken } = await signTokens(payload)
    cookieStore.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE))
    cookieStore.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE))
}

export async function deleteAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

/**
 * Returns the signed-in user, or null. Token rotation normally happens in
 * middleware.ts before the request gets here; the refresh fallback below only
 * matters for requests the middleware doesn't cover (e.g. /api routes).
 * Cookie writes are best-effort because Server Components can't set cookies.
 */
export async function getSession(): Promise<TokenPayLoad | null>{
    const cookieStore = await cookies();

    const fromAccess = await verifyAccessToken(cookieStore.get(ACCESS_COOKIE)?.value)
    if (fromAccess) return fromAccess

    const fromRefresh = await verifyRefreshToken(cookieStore.get(REFRESH_COOKIE)?.value)
    if (fromRefresh) {
        try { await setAuthCookies(fromRefresh) } catch { /* rendering: can't write cookies */ }
        return fromRefresh
    }
    return null;
}

/** For pages and server actions: the signed-in user, or a redirect to /login. */
export async function requireSession(): Promise<TokenPayLoad> {
    const session = await getSession()
    if (!session) redirect('/login')
    return session
}
