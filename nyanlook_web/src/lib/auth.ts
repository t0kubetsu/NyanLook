const COOKIE_NAME = "auth_token";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export async function setToken(token: string): Promise<void> {
  const maxAge = 60 * 60 * 24;
  if (typeof cookieStore !== "undefined") {
    await cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      expires: Date.now() + maxAge * 1000,
      path: "/",
      sameSite: "strict",
    });
  } else {
    // biome-ignore lint/suspicious/noDocumentCookie: fallback for browsers without Cookie Store API
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Strict`;
  }
}

export async function clearToken(): Promise<void> {
  if (typeof cookieStore !== "undefined") {
    await cookieStore.delete({ name: COOKIE_NAME, path: "/" });
  } else {
    // biome-ignore lint/suspicious/noDocumentCookie: fallback for browsers without Cookie Store API
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  }
}
