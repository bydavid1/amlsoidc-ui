"use client";

import { BadgeCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePayment, useStartCheckout } from "../api";

const PAYABLE = new Set(["ASSIGNED", "SOURCING", "IN_TRANSIT", "READY_FOR_DELIVERY"]);

/**
 * Pago del servicio Bringo (docs/design/10-pagos.md): se paga tras el claim
 * y ANTES de confirmar la compra del producto. El buyer solo ve el monto del
 * servicio, nunca el desglose viajero/Bringo.
 */
export function PaymentCard({ orderId, orderStatus }: { orderId: string; orderStatus: string }) {
  const relevant = PAYABLE.has(orderStatus);
  const payment = usePayment(orderId, relevant);
  const checkout = useStartCheckout(orderId);

  if (!relevant || payment.isLoading) return null;

  const status = payment.data?.status;

  if (status === "PAID" || status === "REFUND_DUE") {
    return (
      <Card className="rounded-[24px] border-semantic-up/30 bg-semantic-up/5 shadow-none">
        <CardContent className="flex items-center gap-3 px-8 py-5">
          <BadgeCheck className="size-6 text-semantic-up" />
          <div>
            <p className="title-sm text-ink">Servicio pagado</p>
            <p className="caption text-body-text">
              <span className="number-display !text-[13px]">
                ${payment.data?.amount.toFixed(2)} {payment.data?.currency}
              </span>
              {" · "}ya puedes confirmar la compra del producto
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[24px] border-hairline shadow-none">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 px-8 py-6">
        <div className="flex items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-strong">
            <CreditCard className="size-5 text-primary" />
          </span>
          <div>
            <p className="title-sm text-ink">Paga el servicio de traída</p>
            <p className="caption text-body-text">
              Requerido antes de confirmar tu compra. Cubre el viaje y la
              entrega de Bringo.
            </p>
          </div>
        </div>
        <Button
          className="h-12 rounded-full px-6 font-semibold"
          disabled={checkout.isPending}
          onClick={() => checkout.mutate()}
        >
          {checkout.isPending ? "Abriendo…" : "Pagar servicio"}
        </Button>
      </CardContent>
    </Card>
  );
}
