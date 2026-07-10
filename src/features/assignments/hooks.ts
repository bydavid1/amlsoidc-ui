"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { assignmentsApi } from "./api";

export function useMyAssignments() {
  return useQuery({
    queryKey: ["assignments", "mine"],
    queryFn: assignmentsApi.listMine,
    refetchInterval: 30_000,
  });
}

/** Encargos disponibles para un viaje; polling para ver nuevos pedidos. */
export function useAvailableOrders(tripId: string) {
  return useQuery({
    queryKey: ["assignments", "available", tripId],
    queryFn: () => assignmentsApi.listAvailableOrders(tripId),
    refetchInterval: 30_000,
  });
}

export function useClaimOrder(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => assignmentsApi.claim(tripId, orderId),
    onSuccess: () => {
      toast.success("¡Encargo reclamado! Coordina la recepción del paquete.");
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "ORDER_ALREADY_TAKEN") {
        toast.error("Otro viajero tomó este encargo primero.");
        void queryClient.invalidateQueries({ queryKey: ["assignments"] });
        return;
      }
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Este encargo ya no está disponible.");
        void queryClient.invalidateQueries({ queryKey: ["assignments"] });
        return;
      }
      toast.error("No pudimos reclamar el encargo.");
    },
  });
}

function useAssignmentAction(
  action: (id: string) => Promise<unknown>,
  successMessage: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      toast.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("El encargo cambió de estado. Actualizamos la información.");
        void queryClient.invalidateQueries({ queryKey: ["assignments"] });
        return;
      }
      toast.error("No pudimos completar la acción.");
    },
  });
}

export function useMarkReceived() {
  return useAssignmentAction(assignmentsApi.markReceived, "Paquete marcado como recibido.");
}
export function useMarkInTransit() {
  return useAssignmentAction(assignmentsApi.markInTransit, "¡Buen viaje! El comprador fue notificado.");
}
export function useSetReceivingAddress() {
  return useAssignmentAction2(
    (vars: { id: string; addressLine: string }) =>
      assignmentsApi.setReceivingAddress(vars.id, vars.addressLine),
    "Dirección registrada. El comprador ya puede enviar el producto.",
  );
}

function useAssignmentAction2<TVars>(
  action: (vars: TVars) => Promise<unknown>,
  successMessage: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      toast.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: () => {
      toast.error("No pudimos completar la acción.");
    },
  });
}
