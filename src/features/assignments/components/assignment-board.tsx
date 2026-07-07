"use client";

import { Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { OrderStatusBadge } from "@/components/status/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingDialog } from "@/features/ratings/rating-dialog";
import { Assignment, travelerNextAction } from "../api";
import {
  useAcceptAssignment,
  useMarkArrived,
  useMarkInTransit,
  useMarkReceived,
  useMyAssignments,
  useRejectAssignment,
} from "../hooks";

/** Cuenta regresiva a expiresAt de la oferta (ventana de aceptación del backend). */
function Countdown({ until }: { until: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ms = new Date(until).getTime() - now;
  if (ms <= 0) {
    return <span className="number-display !text-[14px] text-semantic-down">Vencida</span>;
  }
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((ms % 60_000) / 1000);
  const text =
    hours > 0
      ? `${hours}h ${String(minutes).padStart(2, "0")}m`
      : `${minutes}:${String(seconds).padStart(2, "0")}`;
  return (
    <span className="number-display !text-[14px] text-primary" title="Tiempo para aceptar">
      {text}
    </span>
  );
}

function OfferCard({ offer }: { offer: Assignment }) {
  const accept = useAcceptAssignment();
  const reject = useRejectAssignment();
  const busy = accept.isPending || reject.isPending;

  return (
    <Card className="rounded-[16px] border-primary/40 shadow-none">
      <CardContent className="space-y-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Badge className="rounded-full bg-surface-strong caption-strong text-primary uppercase">
              Nueva oferta
            </Badge>
            <p className="title-sm text-ink">{offer.productName}</p>
          </div>
          <div className="text-right">
            <p className="caption text-muted-foreground">Vence en</p>
            <Countdown until={offer.expiresAt} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            className="h-11 rounded-full px-6 font-semibold"
            disabled={busy}
            onClick={() => accept.mutate(offer.id)}
          >
            Aceptar encargo
          </Button>
          <Button
            variant="secondary"
            className="h-11 rounded-full px-6 font-semibold"
            disabled={busy}
            onClick={() => reject.mutate(offer.id)}
          >
            Rechazar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const WAIT_COPY: Record<string, string> = {
  "wait-purchase": "Esperando que el comprador compre el producto…",
  "wait-buyer-confirmation": "Esperando que el comprador confirme la entrega…",
  done: "Entregado — ¡buen trabajo!",
};

function EngagementCard({ assignment }: { assignment: Assignment }) {
  const markReceived = useMarkReceived();
  const markInTransit = useMarkInTransit();
  const markArrived = useMarkArrived();
  const busy = markReceived.isPending || markInTransit.isPending || markArrived.isPending;

  const next = travelerNextAction(assignment);

  return (
    <Card className="rounded-[16px] border-hairline shadow-none">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="space-y-1">
          <p className="title-sm text-ink">{assignment.productName}</p>
          <OrderStatusBadge
            status={
              assignment.orderStatus === "SOURCING" && assignment.fulfillmentStatus
                ? assignment.fulfillmentStatus
                : assignment.orderStatus
            }
          />
        </div>
        <div>
          {next.kind === "mark-received" && (
            <Button
              className="h-11 rounded-full px-5 font-semibold"
              disabled={busy}
              onClick={() => markReceived.mutate(assignment.id)}
            >
              Recibí el paquete
            </Button>
          )}
          {next.kind === "mark-in-transit" && (
            <Button
              className="h-11 rounded-full px-5 font-semibold"
              disabled={busy}
              onClick={() => markInTransit.mutate(assignment.id)}
            >
              Inicio mi viaje
            </Button>
          )}
          {next.kind === "mark-arrived" && (
            <Button
              className="h-11 rounded-full px-5 font-semibold"
              disabled={busy}
              onClick={() => markArrived.mutate(assignment.id)}
            >
              Ya llegué al destino
            </Button>
          )}
          {next.kind === "wait-purchase" || next.kind === "wait-buyer-confirmation" ? (
            <p className="body-sm text-body-text">{WAIT_COPY[next.kind]}</p>
          ) : null}
          {next.kind === "done" &&
            (assignment.orderStatus === "DELIVERED" ? (
              <RatingDialog
                orderId={assignment.orderId}
                counterpartLabel="tu comprador"
                trigger={
                  <Button className="h-11 rounded-full px-5 font-semibold">
                    Calificar al comprador
                  </Button>
                }
              />
            ) : (
              <p className="body-sm text-semantic-up">{WAIT_COPY.done}</p>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AssignmentBoard() {
  const query = useMyAssignments();

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[16px]" />
        ))}
      </div>
    );
  }

  const assignments = query.data ?? [];
  const offers = assignments.filter((a) => a.status === "OFFERED");
  const active = assignments.filter((a) => a.status === "ACCEPTED");
  const history = assignments.filter(
    (a) => a.status !== "OFFERED" && a.status !== "ACCEPTED",
  );

  if (assignments.length === 0) {
    return (
      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-surface-strong">
            <Inbox className="size-7 text-primary" />
          </span>
          <div className="space-y-1">
            <h2 className="title-md text-ink">Sin ofertas por ahora</h2>
            <p className="body-md text-body-text">
              Cuando haya pedidos compatibles con tus viajes, aparecerán aquí.
              Revisamos cada 30 segundos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {offers.length > 0 && (
        <section className="space-y-3">
          <h2 className="title-md text-ink">Ofertas pendientes</h2>
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </section>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="title-md text-ink">Encargos activos</h2>
          {active.map((a) => (
            <EngagementCard key={a.id} assignment={a} />
          ))}
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-3">
          <Separator className="bg-hairline-soft" />
          <h2 className="title-sm text-body-text">Historial</h2>
          {history.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-[12px] bg-surface-soft px-5 py-3"
            >
              <span className="body-sm text-body-text">{a.productName}</span>
              <span className="caption-strong uppercase text-muted-foreground">
                {a.status === "REJECTED" && "Rechazada"}
                {a.status === "EXPIRED" && "Expirada"}
                {a.status === "CANCELLED" && "Cancelada"}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
