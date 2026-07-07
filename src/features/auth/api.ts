import { apiGet, apiPost } from "@/lib/api/client";
import { tokenStore } from "@/lib/auth/token-store";
import { AuthPayload, authPayloadSchema, AuthUser, authUserSchema } from "./schemas";

/**
 * Llamadas de autenticación. Zod parsea cada response en la frontera:
 * si el contrato de la API cambia, falla ruidoso aquí, no en un componente.
 */
export const authApi = {
  async register(email: string, password: string): Promise<AuthPayload> {
    const payload = authPayloadSchema.parse(
      await apiPost<AuthPayload>("/auth/register", { email, password }),
    );
    tokenStore.setSession(payload.accessToken, payload.refreshToken);
    return payload;
  },

  async login(email: string, password: string): Promise<AuthPayload> {
    const payload = authPayloadSchema.parse(
      await apiPost<AuthPayload>("/auth/login", { email, password }),
    );
    tokenStore.setSession(payload.accessToken, payload.refreshToken);
    return payload;
  },

  async me(): Promise<AuthUser> {
    return authUserSchema.parse(await apiGet<AuthUser>("/auth/me"));
  },

  /** Revoca la familia del refresh token en el backend y limpia el cliente. */
  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefresh();
    try {
      if (refreshToken) {
        await apiPost("/auth/logout", { refreshToken });
      }
    } finally {
      tokenStore.clear();
    }
  },
};
