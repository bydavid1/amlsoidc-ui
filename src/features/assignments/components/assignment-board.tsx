"use client";

import { Inbox } from "lucide-react";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/status/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingDialog } from "@/features/ratings/rating-dialog";
import { SIZE_UI, SizeCategory } from "@/features/orders/schemas";
import { Assignment, travelerNextAction } from "../api";
import {
  useMarkArrived,
  useMarkInTransit,
  useMarkReceived,
  useMyAssignments,
} from "../hooks";

const WAIT_COPY: Record<string, string> = {
  "wait-purchase": "Esperando que el comprador compre el producto…",
  "wait-buyer-confirmation": "Esperando que el comprador confirme la entrega…",
  done: "Entregado — ¡buen trabajo!",
};

export function EngagementCard({ assignment }: { assignment: Assignment }) {
  const markReceived = useMarkReceived();
  const markInTransit = useMarkInTransit();
  const markArrived = useMarkArrived();
  const busy = markReceived.isPending || markInTransit.isPending || markArrived.isPending;

  const next = travelerNextAction(assignment);
  const sizeUi = SIZE_UI[assignment.sizeCategory as SizeCategory];

  return (
    <Card className="rounded-[16px] border-hairline shadow-none">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <p className="title-sm text-ink">{assignment.productName}</p>
            <span className="number-display !text-[15px] text-semantic-up">
              +${assignment.travelerRewardAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge
              status={
                assignment.orderStatus === "SOURCING" && assignment.fulfillmentStatus
                  ? assignment.fulfillmentStatus
                  : assignment.orderStatus
              }
            />
            {sizeUi && <span className="caption text-muted-foreground">{sizeUi.label}</span>}
          </div>
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
          {(next.kind === "wait-purchase" || next.kind === "wait-buyer-confirmation") && (
            <p className="body-sm text-body-text">{WAIT_COPY[next.kind]}</p>
          )}
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
  const active = assignments.filter((a) => a.status === "ACCEPTED");
  const history = assignments.filter((a) => a.status !== "ACCEPTED");

  if (assignments.length === 0) {
    return (
      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-surface-strong">
            <Inbox className="size-7 text-primary" />
          </span>
          <div className="space-y-1">
            <h2 className="title-md text-ink">Aún no llevas encargos</h2>
            <p className="body-md text-body-text">
              Entra a uno de tus viajes publicados y elige los encargos que te quepan.
            </p>
          </div>
          <Button asChild className="h-12 rounded-full px-6 font-semibold">
            <Link href="/viajar">Ver mis viajes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
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
                {a.status === "CANCELLED" ? "Cancelado" : a.status}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
