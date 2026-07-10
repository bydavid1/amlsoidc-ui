"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet, apiPost } from "@/lib/api/client";
import { statusLabel } from "@/components/status/order-status";

export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AppNotification = z.infer<typeof notificationSchema>;

export const notificationsApi = {
  async list(unreadOnly = false): Promise<AppNotification[]> {
    return z
      .array(notificationSchema)
      .parse(await apiGet<AppNotification[]>("/notifications", { limit: 50, unreadOnly }));
  },
  markRead(id: string): Promise<unknown> {
    return apiPost(`/notifications/${id}/read`);
  },
};

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "mine"],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount(): number {
  const { data } = useNotifications();
  return data?.filter((n) => n.readAt === null).length ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Traducción del evento a texto + destino de navegación. */
export function describeNotification(n: AppNotification): { text: string; href: string } {
  const orderId = typeof n.payload.orderId === "string" ? n.payload.orderId : null;
  switch (n.type) {
    case "TRAVELER_ASSIGNED": {
      const name = typeof n.payload.travelerFirstName === "string" ? n.payload.travelerFirstName : null;
      return {
        text: name ? `¡${name} aceptó llevar tu pedido!` : "¡Tu pedido ya tiene viajero asignado!",
        href: orderId ? `/comprar/${orderId}` : "/comprar",
      };
    }
    case "ORDER_STATUS_CHANGED": {
      const to = typeof n.payload.to === "string" ? n.payload.to : "";
      const state = to.startsWith("fulfillment:") ? to.replace("fulfillment:", "") : to;
      const name = typeof n.payload.travelerFirstName === "string" ? n.payload.travelerFirstName : null;
      const NARRATIVE: Record<string, string> = name ? {
        SOURCING: `${name} está gestionando tu pedido.`,
        "fulfillment:RECEIVED_BY_TRAVELER": `${name} ya tiene tu paquete.`,
        IN_TRANSIT: `${name} va en camino a El Salvador.`,
        READY_FOR_DELIVERY: "Tu paquete llegó — Bringo te lo entrega.",
      } : {};
      const narrated = NARRATIVE[to] ?? NARRATIVE[state];
      return {
        text: narrated ?? `Tu pedido cambió a: ${statusLabel(state)}.`,
        href: orderId ? `/comprar/${orderId}` : "/comprar",
      };
    }
    default:
      return { text: "Tienes una notificación nueva.", href: "/notificaciones" };
  }
}
