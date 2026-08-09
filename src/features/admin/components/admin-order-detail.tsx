"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { OrderStatusBadge } from "@/components/status/order-status-badge";
import { OrderTimeline } from "@/components/status/order-timeline";
import { OrderStatus, statusLabel } from "@/components/status/order-status";
import { StatusStepper } from "@/components/status/status-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminOrder,
  useConfirmHubReception,
  useDispatchToBuyer,
  useRegisterProcurement,
  useRegisterTracking,
} from "@/features/admin/api";
import { cn } from "@/lib/utils";

function flowLabel(flowType: string): string {
  if (flowType === "TRAVELER_PURCHASES_PRODUCT") return "A";
  if (flowType === "BRINGO_PURCHASES_DIRECT_DELIVERY") return "B";
  if (flowType === "BRINGO_PURCHASES_HUB_DELIVERY") return "C";
  return flowType;
}

function HubReceptionDialog({ orderId, productName }: { orderId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const confirm = useConfirmHubReception();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full px-5 font-semibold">Confirmar recepción en punto Bringo</Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">Recepción en punto Bringo</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            {productName} — confirma llegada al hub y, si aplica, puntúa al viajero.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} type="button" onClick={() => setScore(v === score ? 0 : v)}>
              <Star
                className={cn(
                  "size-8",
                  score >= v ? "fill-accent-yellow text-accent-yellow" : "text-hairline",
                )}
              />
            </button>
          ))}
        </div>
        <Button
          className="h-12 w-full rounded-full font-semibold"
          disabled={confirm.isPending}
          onClick={() =>
            confirm.mutate(
              { orderId, travelerScore: score || undefined },
              { onSuccess: () => setOpen(false) },
            )
          }
        >
          {confirm.isPending ? "Confirmando…" : "Confirmar recepción"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function AdminOrderDetail({ orderId }: { orderId: string }) {
  const query = useAdminOrder(orderId);
  const registerProcurement = useRegisterProcurement();
  const registerTracking = useRegisterTracking();
  const dispatchToBuyer = useDispatchToBuyer();

  const [trackingNumber, setTrackingNumber] = useState("");

  const order = query.data;

  const actions = useMemo(() => {
    if (!order) {
      return {
        canRegisterProcurement: false,
        canRegisterTracking: false,
        canConfirmHubReception: false,
        canDispatchToBuyer: false,
      };
    }

    const isFlowBOrC =
      order.flowType === "BRINGO_PURCHASES_DIRECT_DELIVERY" ||
      order.flowType === "BRINGO_PURCHASES_HUB_DELIVERY";

    const inSourcingWindow = order.status === "ASSIGNED" || order.status === "SOURCING";

    return {
      canRegisterProcurement:
        isFlowBOrC && inSourcingWindow && order.fulfillmentStatus === "AWAITING_PURCHASE",
      canRegisterTracking: isFlowBOrC && inSourcingWindow && order.fulfillmentStatus === "PURCHASED",
      canConfirmHubReception:
        order.flowType === "BRINGO_PURCHASES_HUB_DELIVERY" &&
        order.status === "IN_TRANSIT" &&
        order.fulfillmentStatus === "RECEIVED_BY_TRAVELER",
      canDispatchToBuyer:
        order.flowType === "BRINGO_PURCHASES_HUB_DELIVERY" &&
        order.status === "READY_FOR_DELIVERY" &&
        order.fulfillmentStatus === "HUB_RECEIVED_BY_BRINGO",
    };
  }, [order]);

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-32 w-full rounded-[24px]" />
        <Skeleton className="h-80 w-full rounded-[24px]" />
      </div>
    );
  }

  if (query.isError || !order) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="body-md text-semantic-down">No encontramos esta orden.</p>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/admin/operacion">Volver a operación</Link>
        </Button>
      </div>
    );
  }

  const traveler = order.travelerName ?? order.travelerEmail ?? "Sin viajero asignado";
  const isFlowA = order.flowType === "TRAVELER_PURCHASES_PRODUCT";
  const hasAnyAction =
    actions.canRegisterProcurement ||
    actions.canRegisterTracking ||
    actions.canConfirmHubReception ||
    actions.canDispatchToBuyer;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/admin/operacion"
          className="inline-flex items-center gap-1 body-sm font-medium text-body-text hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Cola de operación
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="display-sm text-ink">{order.productName}</h1>
          <OrderStatusBadge status={order.fulfillmentStatus ?? order.status} />
        </div>

        <p className="body-sm text-body-text">
          Flujo {flowLabel(order.flowType)} · Paso actual: {statusLabel(order.flowStep)}
        </p>
      </div>

      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="p-8">
          <StatusStepper
            status={order.status as OrderStatus}
            fulfillmentStatus={order.fulfillmentStatus}
          />
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="space-y-4 p-8">
          <h2 className="title-md text-ink">Acciones operativas</h2>
          <Separator className="bg-hairline-soft" />

          {isFlowA && (
            <p className="body-md text-body-text">
              Flujo A: solo lectura para operación. La compra y pasos logísticos los ejecuta el
              viajero.
            </p>
          )}

          {!isFlowA && !hasAnyAction && (
            <p className="body-md text-body-text">
              Esta orden no tiene acciones disponibles en este paso.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {actions.canRegisterProcurement && (
              <Button
                className="h-11 rounded-full px-5 font-semibold"
                disabled={registerProcurement.isPending}
                onClick={() => registerProcurement.mutate(order.id)}
              >
                {registerProcurement.isPending ? "Registrando…" : "Registrar compra"}
              </Button>
            )}

            {actions.canDispatchToBuyer && (
              <Button
                variant="secondary"
                className="h-11 rounded-full px-5 font-semibold"
                disabled={dispatchToBuyer.isPending}
                onClick={() => dispatchToBuyer.mutate(order.id)}
              >
                {dispatchToBuyer.isPending
                  ? "Registrando…"
                  : "Marcar despachado hacia comprador"}
              </Button>
            )}

            {actions.canConfirmHubReception && (
              <HubReceptionDialog orderId={order.id} productName={order.productName} />
            )}
          </div>

          {actions.canRegisterTracking && (
            <form
              className="flex max-w-xl flex-wrap items-center gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const value = trackingNumber.trim();
                if (!value) return;
                registerTracking.mutate(
                  { orderId: order.id, trackingNumber: value },
                  { onSuccess: () => setTrackingNumber("") },
                );
              }}
            >
              <Input
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value)}
                placeholder="Número de guía"
                className="h-11 min-w-[260px] rounded-full"
              />
              <Button
                type="submit"
                className="h-11 rounded-full px-5 font-semibold"
                disabled={registerTracking.isPending || trackingNumber.trim().length < 3}
              >
                {registerTracking.isPending ? "Registrando…" : "Registrar tracking"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Detalle operativo</h2>
            <Separator className="bg-hairline-soft" />
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Comprador</dt>
                <dd className="body-sm font-semibold text-ink">{order.buyerEmail}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Viajero</dt>
                <dd className="body-sm font-semibold text-ink">{traveler}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Flujo</dt>
                <dd className="body-sm font-semibold text-ink">{flowLabel(order.flowType)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Paso</dt>
                <dd className="body-sm font-semibold text-ink">{statusLabel(order.flowStep)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Historial</h2>
            <Separator className="bg-hairline-soft" />
            {order.timeline.length === 0 ? (
              <p className="body-sm text-body-text">
                Historial no disponible en esta respuesta. Si acabas de actualizar backend,
                reinicia el servicio para habilitar el endpoint de detalle admin.
              </p>
            ) : (
              <OrderTimeline entries={order.timeline} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
