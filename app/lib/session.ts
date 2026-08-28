import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ACCESS_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
const REFRESH_TOKEN = new TextEncoder().encode(process.env.ACCESS_REFRESH_SECRET)

export interface TokenPayLoad {
    userId: string;
    userName: string;
}

export async function setAuthCookies(payload: TokenPayLoad) {
    const cookieStore = await cookies()

    const accessToken = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(ACCESS_SECRET)

    // Long lived Refresh Token (7 days)

    const refreshToken = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_TOKEN)

    cookieStore.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60
    });

      cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
    });
}

export async function deleteAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

/**
 * Validates session. If access token is expired, checks refresh token 
 * and automatically rotates tokens seamlessly.
 */

export async function getSession(): Promise<TokenPayLoad | null>{
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if(accessToken){
        try {
            const { payload } = await jwtVerify(accessToken, ACCESS_SECRET)
            return { userId: payload.userId as string, userName: payload.userName as string}
        } catch{

        }
    }

    if(refreshToken) {
        try {
            const { payload } = await jwtVerify(refreshToken, REFRESH_TOKEN);
            const user: TokenPayLoad = {userId: payload.userId as string, userName: payload.userName as string}

            await setAuthCookies(user)
            return user
        } catch {
            await deleteAuthCookies()
            return null;
        }
    }
    return null;
}