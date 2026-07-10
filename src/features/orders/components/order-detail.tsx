"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ExternalLink, MapPin, Star, UserRound } from "lucide-react";
import Link from "next/link";
import { SupportButton } from "@/components/layout/support-button";
import { OrderStatusBadge } from "@/components/status/order-status-badge";
import { OrderTimeline } from "@/components/status/order-timeline";
import { StatusStepper } from "@/components/status/status-stepper";
import { buyerActions, OrderStatus } from "@/components/status/order-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportIssueDialog } from "@/features/incidents/report-issue-dialog";
import { RatingDialog } from "@/features/ratings/rating-dialog";
import { useCancelOrder, useConfirmDelivery, useConfirmPurchase, useOrder } from "../hooks";

const ACTIVE_STATUSES = new Set([
  "PENDING_ASSIGNMENT",
  "ASSIGNED",
  "SOURCING",
  "IN_TRANSIT",
  "READY_FOR_DELIVERY",
]);

export function OrderDetail({ orderId }: { orderId: string }) {
  const query = useOrder(orderId, { poll: true });
  const confirmPurchase = useConfirmPurchase();
  const confirmDelivery = useConfirmDelivery();
  const cancelOrder = useCancelOrder();

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72 rounded-full" />
        <Skeleton className="h-32 w-full rounded-[24px]" />
        <Skeleton className="h-64 w-full rounded-[24px]" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="body-md text-semantic-down">No encontramos este pedido.</p>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/comprar">Volver a mis pedidos</Link>
        </Button>
      </div>
    );
  }

  const order = query.data;
  const status = order.status as OrderStatus;
  const busy =
    confirmPurchase.isPending || confirmDelivery.isPending || cancelOrder.isPending;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/comprar"
          className="inline-flex items-center gap-1 body-sm font-medium text-body-text hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Mis pedidos
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="display-sm text-ink">{order.productName}</h1>
          <OrderStatusBadge status={order.displayStatus} />
        </div>
        {ACTIVE_STATUSES.has(status) && (
          <p className="caption text-muted-foreground">
            Se actualiza automáticamente cada 30 segundos.
          </p>
        )}
      </div>

      {/* progreso del flujo feliz */}
      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="p-8">
          <StatusStepper status={status} fulfillmentStatus={order.fulfillmentStatus} />
        </CardContent>
      </Card>

      {/* percepción estilo Uber: el viajero como protagonista, SIN contacto */}
      {order.traveler && (
        <Card className="rounded-[24px] border-primary/25 bg-primary/5 shadow-none">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 px-8 py-6">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserRound className="size-6" />
              </span>
              <div>
                <p className="title-md text-ink">
                  {order.traveler.firstName ?? "Tu viajero"} lleva tu pedido
                </p>
                <p className="body-sm text-body-text">
                  <Star className="mr-1 inline size-3.5 fill-accent-yellow text-accent-yellow" />
                  <span className="number-display !text-[14px]">
                    {order.traveler.reputationCount > 0
                      ? order.traveler.reputationScore.toFixed(1)
                      : "Nuevo"}
                  </span>
                  {order.traveler.reputationCount > 0 && (
                    <> · {order.traveler.reputationCount} entregas calificadas</>
                  )}
                </p>
              </div>
            </div>
            <SupportButton context={`mi pedido ${order.productName}`} />
          </CardContent>
        </Card>
      )}

      {/* dirección de envío ANÓNIMA (modelo hub: sin datos del viajero) */}
      {order.receivingAddress &&
        (status === "ASSIGNED" || status === "SOURCING") && (
          <Card className="rounded-[24px] border-hairline shadow-none">
            <CardContent className="flex items-start gap-4 px-8 py-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-strong">
                <MapPin className="size-5 text-primary" />
              </span>
              <div>
                <p className="title-sm text-ink">Envía tu producto a esta dirección</p>
                <p className="number-display !text-[15px] mt-1 text-ink">
                  {order.receivingAddress}
                </p>
                <p className="caption mt-1 text-muted-foreground">
                  Es la dirección de recepción en {order.status === "ASSIGNED" ? "EE.UU." : "origen"}.
                  Al llegar a El Salvador, Bringo te lo entrega.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      {/* acciones disponibles SEGÚN el estado real (la máquina vive en el backend) */}
      <div className="flex flex-wrap gap-3">
        {buyerActions.canConfirmPurchase(status, order.fulfillmentStatus) && (
          <Button
            className="h-12 rounded-full px-6 font-semibold"
            disabled={busy}
            onClick={() => confirmPurchase.mutate(order.id)}
          >
            Ya compré el producto
          </Button>
        )}
        {buyerActions.canConfirmDelivery(status) && (
          <Button
            className="h-12 rounded-full px-6 font-semibold"
            disabled={busy}
            onClick={() => confirmDelivery.mutate(order.id)}
          >
            Confirmar que lo recibí
          </Button>
        )}
        {buyerActions.canRate(status) && (
          <RatingDialog
            orderId={order.id}
            title="Califica tu experiencia"
            trigger={
              <Button className="h-12 rounded-full px-6 font-semibold">
                Calificar mi experiencia
              </Button>
            }
          />
        )}
        {buyerActions.canCancel(status, order.fulfillmentStatus) && (
          <Button
            variant="secondary"
            className="h-12 rounded-full px-6 font-semibold text-semantic-down"
            disabled={busy}
            onClick={() => {
              if (window.confirm("¿Cancelar este pedido?")) {
                cancelOrder.mutate(order.id);
              }
            }}
          >
            Cancelar pedido
          </Button>
        )}
        {buyerActions.canReportIssue(status) && (
          <ReportIssueDialog
            orderId={order.id}
            trigger={
              <Button
                variant="ghost"
                className="h-12 rounded-full px-6 font-semibold text-body-text"
                disabled={busy}
              >
                Reportar un problema
              </Button>
            }
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* datos del pedido */}
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Detalles</h2>
            <Separator className="bg-hairline-soft" />
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Precio del producto</dt>
                <dd className="number-display text-ink">
                  ${order.estimatedPriceAmount.toFixed(2)} {order.estimatedPriceCurrency}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Total aproximado (con servicio)</dt>
                <dd className="number-display text-primary">
                  ${order.estimatedTotalAmount.toFixed(2)} {order.estimatedPriceCurrency}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Tamaño</dt>
                <dd className="body-sm font-semibold text-ink">
                  {order.sizeCategory === "SMALL"
                    ? "Pequeño"
                    : order.sizeCategory === "MEDIUM"
                      ? "Mediano"
                      : "Grande"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Creado</dt>
                <dd className="number-display !text-[14px] text-ink">
                  {format(new Date(order.createdAt), "d 'de' MMMM yyyy", { locale: es })}
                </dd>
              </div>
              {order.neededBy && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="body-sm text-body-text">Lo necesita antes de</dt>
                  <dd className="number-display !text-[14px] text-ink">
                    {format(new Date(order.neededBy), "d 'de' MMMM yyyy", { locale: es })}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4">
                <dt className="body-sm text-body-text">Producto</dt>
                <dd>
                  <a
                    href={order.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 body-sm font-semibold text-primary"
                  >
                    Ver en la tienda <ExternalLink className="size-3.5" />
                  </a>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* timeline de dos niveles */}
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-4 p-8">
            <h2 className="title-md text-ink">Historial</h2>
            <Separator className="bg-hairline-soft" />
            <OrderTimeline entries={order.timeline} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
