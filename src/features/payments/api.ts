"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { apiGet, apiPost } from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";

export const paymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUND_DUE", "REFUNDED"]),
  amount: z.coerce.number(),
  currency: z.string(),
  paidAt: z.string().nullable(),
});
export type Payment = z.infer<typeof paymentSchema>;

export const paymentsApi = {
  async get(orderId: string): Promise<Payment | null> {
    const data = await apiGet<Payment | null>(`/orders/${orderId}/payment`);
    return data ? paymentSchema.parse(data) : null;
  },
  checkout(orderId: string): Promise<{ checkoutUrl: string; amount: number; currency: string }> {
    return apiPost(`/orders/${orderId}/payment/checkout`);
  },
};

export function usePayment(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ["payments", orderId],
    queryFn: () => paymentsApi.get(orderId),
    enabled,
    refetchInterval: 30_000,
  });
}

/** Inicia el checkout y redirige al proveedor. */
export function useStartCheckout(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => paymentsApi.checkout(orderId),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ["payments", orderId] });
      window.location.assign(session.checkoutUrl);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "ALREADY_PAID") {
        toast.info("El servicio ya está pagado.");
        void queryClient.invalidateQueries({ queryKey: ["payments", orderId] });
        return;
      }
      toast.error("No pudimos iniciar el pago. Intenta de nuevo.");
    },
  });
}
