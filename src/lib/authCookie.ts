const AUTH_COOKIE_NAME = 'sb-access-token';

function getCookieMaxAge(expiresAt?: number | null): number {
  if (expiresAt) {
    const seconds = expiresAt - Math.floor(Date.now() / 1000);
    return Math.max(seconds, 60);
  }
  return 60 * 60 * 24 * 7;
}

/**
 * Persist the Supabase access token in a cookie so Next.js middleware can authenticate requests.
 */
export function setAuthSessionCookie(accessToken: string, expiresAt?: number | null) {
  if (typeof document === 'undefined') return;

  const maxAge = getCookieMaxAge(expiresAt);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(accessToken)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearAuthSessionCookie() {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${secure}`;
}
