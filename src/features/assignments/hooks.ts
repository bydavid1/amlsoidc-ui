"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { assignmentsApi } from "./api";

export function useMyAssignments() {
  return useQuery({
    queryKey: ["assignments", "mine"],
    queryFn: assignmentsApi.listMine,
    // sin websockets: las ofertas nuevas llegan por polling
    refetchInterval: 30_000,
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
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.code === "ASSIGNMENT_EXPIRED") {
          toast.error("La oferta venció. El pedido se ofrecerá a otro viajero.");
          void queryClient.invalidateQueries({ queryKey: ["assignments"] });
          return;
        }
        if (error.status === 409) {
          toast.error("El encargo cambió de estado. Actualizamos la información.");
          void queryClient.invalidateQueries({ queryKey: ["assignments"] });
          return;
        }
      }
      toast.error("No pudimos completar la acción.");
    },
  });
}

export function useAcceptAssignment() {
  return useAssignmentAction(assignmentsApi.accept, "¡Encargo aceptado! Coordina la recepción del paquete.");
}
export function useRejectAssignment() {
  return useAssignmentAction(assignmentsApi.reject, "Oferta rechazada.");
}
export function useMarkReceived() {
  return useAssignmentAction(assignmentsApi.markReceived, "Paquete marcado como recibido.");
}
export function useMarkInTransit() {
  return useAssignmentAction(assignmentsApi.markInTransit, "¡Buen viaje! El comprador fue notificado.");
}
export function useMarkArrived() {
  return useAssignmentAction(
    assignmentsApi.markArrived,
    "Llegada registrada. Coordina la entrega con el comprador.",
  );
}
