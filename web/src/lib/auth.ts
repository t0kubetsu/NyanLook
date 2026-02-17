const COOKIE_NAME = "auth_token";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string): void {
  // 24 h lifetime, SameSite=Strict, no httpOnly so middleware can read it client-side.
  // If your Next.js app and API are same-origin in prod, add Secure.
  const maxAge = 60 * 60 * 24;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

export function clearToken(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
