import { apiPost } from "@/lib/api/client";

/**
 * Activación de perfiles (idempotente en el backend): otorga el rol
 * BUYER/TRAVELER. Tras activar, refrescar el usuario (los roles cambian).
 */
export const profilesApi = {
  activateBuyer(): Promise<{ id: string; userId: string }> {
    return apiPost("/users/me/buyer-profile");
  },
  activateTraveler(): Promise<{ id: string; userId: string }> {
    return apiPost("/users/me/traveler-profile");
  },
};
