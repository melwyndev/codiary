import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL || 'https://hxpct5r5.eu-central.insforge.app',
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'anon_22aa1ba06252dde17f0efd8bea0322d0ca8e6283d1c1f3610bad07f7c7319560',
});

export const AUTH_TOKEN_STORAGE_KEY = 'codiary_auth_token';

/**
 * Persist access token to localStorage and attach it to the InsForge client so
 * all database and PostgREST operations carry the authenticated JWT session.
 */
export function setPersistedAuthToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    } catch (e) {}
  }
  insforge.setAccessToken(token);
}

// Hydrate persisted access token on initial client-side script execution
if (typeof window !== 'undefined') {
  try {
    const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (storedToken) {
      insforge.setAccessToken(storedToken);
    }
  } catch (e) {}
}
