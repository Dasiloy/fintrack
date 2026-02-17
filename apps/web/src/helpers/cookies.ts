import { cookies } from "next/headers";

/**
 * Helper to set refresh token cookie
 * Call this after successful login/token refresh
 */
export async function setRefreshTokenCookie(refresh_token: string) {
  (await cookies()).set("refresh-token", refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

/**
 * Helper to get refresh token from cookie
 */
export async function getRefreshToken() {
  return (await cookies()).get("refresh-token")?.value;
}

/**
 * Helper to clear all auth cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("refresh-token");
}
