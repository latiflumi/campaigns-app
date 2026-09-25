// app/lib/tokens.ts
// JWT signing/verification shared by middleware.ts and lib/session.ts.
// Deliberately free of next/headers and "server-only" (which throws outside the
// React server layer), so middleware can import it. Never import from client code.

import { SignJWT, jwtVerify } from "jose"

const ACCESS_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
const REFRESH_SECRET = new TextEncoder().encode(process.env.ACCESS_REFRESH_SECRET)

export const ACCESS_COOKIE = "access_token"
export const REFRESH_COOKIE = "refresh_token"
export const ACCESS_MAX_AGE = 15 * 60 // seconds
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60

export interface TokenPayLoad {
  userId: string
  userName: string
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
})

export async function signTokens(payload: TokenPayLoad) {
  const claims = { userId: payload.userId, userName: payload.userName }
  const accessToken = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_MAX_AGE}s`)
    .sign(ACCESS_SECRET)
  const refreshToken = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_MAX_AGE}s`)
    .sign(REFRESH_SECRET)
  return { accessToken, refreshToken }
}

async function verify(token: string | undefined, secret: Uint8Array): Promise<TokenPayLoad | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    if (typeof payload.userId !== "string" || typeof payload.userName !== "string") return null
    return { userId: payload.userId, userName: payload.userName }
  } catch {
    return null // bad signature, expired, malformed
  }
}

export const verifyAccessToken = (token: string | undefined) => verify(token, ACCESS_SECRET)
export const verifyRefreshToken = (token: string | undefined) => verify(token, REFRESH_SECRET)
