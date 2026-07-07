import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { tokenStore } from "@/lib/auth/token-store";
import { ApiError, ApiErrorEnvelope, ApiEnvelope, ApiMeta } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3006/api/v1";

/**
 * Cliente HTTP de Bringo:
 * 1) adjunta el Bearer token;
 * 2) des-envuelve el envelope { success, data, meta } UNA sola vez;
 * 3) ante 401 UNAUTHENTICATED hace UN refresh single-flight y reintenta.
 *
 * Single-flight es obligatorio: el backend ROTA el refresh token en cada uso
 * y detecta reuso (revoca la familia). Dos refresh concurrentes con el mismo
 * token = sesión muerta. Por eso todas las peticiones en vuelo esperan la
 * misma promesa de refresh.
 */
export const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -------- refresh single-flight --------
let refreshInFlight: Promise<boolean> | null = null;

export interface AuthPayload {
  user: { id: string; email: string; roles: string[]; status: string };
  accessToken: string;
  refreshToken: string;
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;
  try {
    // axios "crudo" (sin interceptores) para no recursar
    const res = await axios.post<ApiEnvelope<AuthPayload>>(`${BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    tokenStore.setSession(res.data.data.accessToken, res.data.data.refreshToken);
    return true;
  } catch {
    // refresh inválido/expirado/reusado → sesión terminada
    tokenStore.clear();
    notifySessionExpired();
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= refreshSession().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Rehidrata la sesión al montar la app: si hay refresh token persistido,
 * lo rota para obtener un access token fresco. Devuelve si hay sesión.
 */
export function bootstrapSession(): Promise<boolean> {
  if (!tokenStore.getRefresh()) return Promise.resolve(false);
  return refreshOnce();
}

/** La UI (auth provider) se suscribe para redirigir a /login al morir la sesión. */
type SessionListener = () => void;
const sessionListeners = new Set<SessionListener>();
export function onSessionExpired(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}
function notifySessionExpired(): void {
  sessionListeners.forEach((l) => l());
}

// -------- envelope + errores + retry --------
http.interceptors.response.use(
  // éxito: entregar el envelope completo (los helpers extraen data/meta)
  (response) => response,
  async (error: AxiosError<ApiErrorEnvelope>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data?.error;
    const requestId = error.response?.data?.meta?.requestId;
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    // 401 → intentar refresh una vez y reintentar la petición original
    if (status === 401 && body?.code === "UNAUTHENTICATED" && original && !original._retried) {
      const refreshed = await refreshOnce();
      if (refreshed) {
        original._retried = true;
        delete original.headers.Authorization; // que el request interceptor ponga el nuevo
        return http.request(original);
      }
    }

    if (body) {
      throw new ApiError(body.code, body.message, status, body.details, requestId);
    }
    // error de red / sin envelope
    throw new ApiError("NETWORK_ERROR", error.message || "Network error", status);
  },
);

// -------- helpers tipados --------
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await http.get<ApiEnvelope<T>>(url, { params });
  return res.data.data;
}

export async function apiGetWithMeta<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<{ data: T; meta: ApiMeta }> {
  const res = await http.get<ApiEnvelope<T>>(url, { params });
  return { data: res.data.data, meta: res.data.meta };
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await http.post<ApiEnvelope<T>>(url, body);
  return res.data?.data as T; // 204 (logout) no trae body
}
