/**
 * Sesión del cliente:
 * - access token (15 min) SOLO en memoria — nunca se persiste.
 * - refresh token (7 días, rotado por el backend en cada uso) en localStorage.
 *   Riesgo R1 del plan: mitigado por rotación + detección de reuso del backend.
 */
const REFRESH_KEY = "bringo.refresh";

let accessToken: string | null = null;

export const tokenStore = {
  getAccess(): string | null {
    return accessToken;
  },
  setAccess(token: string | null): void {
    accessToken = token;
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  setRefresh(token: string | null): void {
    if (typeof window === "undefined") return;
    if (token) {
      window.localStorage.setItem(REFRESH_KEY, token);
    } else {
      window.localStorage.removeItem(REFRESH_KEY);
    }
  },
  setSession(access: string, refresh: string): void {
    this.setAccess(access);
    this.setRefresh(refresh);
  },
  clear(): void {
    accessToken = null;
    this.setRefresh(null);
  },
  hasSession(): boolean {
    return this.getRefresh() !== null;
  },
};
