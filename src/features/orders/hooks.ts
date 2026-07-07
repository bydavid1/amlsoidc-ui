"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { ordersApi } from "./api";

const PAGE_SIZE = 10;

export function useMyOrders(status?: string) {
  return useInfiniteQuery({
    queryKey: ["orders", "list", { status: status ?? "ALL" }],
    queryFn: ({ pageParam }) =>
      ordersApi.list({ limit: PAGE_SIZE, cursor: pageParam ?? undefined, status }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useOrder(orderId: string, options?: { poll?: boolean }) {
  return useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => ordersApi.get(orderId),
    // sin websockets en el MVP: el detalle activo se refresca por polling
    refetchInterval: options?.poll ? 30_000 : false,
  });
}

/**
 * Mutación de acción sobre un pedido. Ante 409 (transición inválida por
 * carrera con la otra parte) NO es un bug: se re-fetch-ea y se explica.
 */
function useOrderAction(action: (orderId: string) => Promise<unknown>, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (_data, orderId) => {
      toast.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    },
    onError: (error, orderId) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("El pedido cambió de estado. Actualizamos la información.");
        void queryClient.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
        return;
      }
      toast.error("No pudimos completar la acción. Intenta de nuevo.");
    },
  });
}

export function useConfirmPurchase() {
  return useOrderAction(ordersApi.confirmPurchase, "Compra confirmada — avisamos al viajero.");
}

export function useConfirmDelivery() {
  return useOrderAction(
    ordersApi.confirmDelivery,
    "¡Entrega confirmada! Ya puedes calificar al viajero.",
  );
}

export function useCancelOrder() {
  return useOrderAction(ordersApi.cancel, "Pedido cancelado.");
}
