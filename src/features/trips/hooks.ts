"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { tripsApi } from "./api";

const PAGE_SIZE = 10;

export function useMyTrips(status?: string) {
  return useInfiniteQuery({
    queryKey: ["trips", "list", { status: status ?? "ALL" }],
    queryFn: ({ pageParam }) =>
      tripsApi.list({ limit: PAGE_SIZE, cursor: pageParam ?? undefined, status }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function usePublishTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.publish,
    onSuccess: () => {
      toast.success("Viaje publicado. Te avisaremos cuando haya pedidos compatibles.");
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("El viaje ya no está en borrador.");
        void queryClient.invalidateQueries({ queryKey: ["trips"] });
        return;
      }
      toast.error("No pudimos publicar el viaje.");
    },
  });
}

export function useCancelTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.cancel,
    onSuccess: (result) => {
      const n = result.affectedOrderIds.length;
      toast.success(
        n > 0
          ? `Viaje cancelado. ${n} pedido(s) volverán a asignarse automáticamente.`
          : "Viaje cancelado.",
      );
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Este viaje ya no se puede cancelar.");
        void queryClient.invalidateQueries({ queryKey: ["trips"] });
        return;
      }
      toast.error("No pudimos cancelar el viaje.");
    },
  });
}
