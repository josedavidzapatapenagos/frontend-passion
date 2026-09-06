const CHECKOUT_CONTEXT_COOKIE_PREFIX = "vipCheckout";
const CHECKOUT_CONTEXT_MAX_AGE_SECONDS = 60 * 60 * 24;

const buildCookieName = (key: string) => `${CHECKOUT_CONTEXT_COOKIE_PREFIX}${key}`;

export const setCheckoutContextCookie = (key: string, value: string) => {
  const cookieName = buildCookieName(key);
  document.cookie = `${encodeURIComponent(cookieName)}=${encodeURIComponent(value)}; Max-Age=${CHECKOUT_CONTEXT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
};

export const getCheckoutContextCookie = (key: string): string | null => {
  const cookieName = encodeURIComponent(buildCookieName(key));
  const cookieEntry = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${cookieName}=`));

  if (!cookieEntry) {
    return null;
  }

  const rawValue = cookieEntry.slice(cookieName.length + 1);

  return decodeURIComponent(rawValue).trim() || null;
};

export const clearCheckoutContextCookie = (key: string) => {
  const cookieName = buildCookieName(key);
  document.cookie = `${encodeURIComponent(cookieName)}=; Max-Age=0; Path=/; SameSite=Lax`;
};