"use client";

import { PackageCheck, Star } from "lucide-react";
import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AdminOrder, useAdminOrders, useConfirmHubReception } from "@/features/admin/api";
import { cn } from "@/lib/utils";

/** Confirmar recepción en hub con puntuación opcional del viajero. */
function HubReceptionDialog({ order }: { order: AdminOrder }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const confirm = useConfirmHubReception();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full px-5 font-semibold">
          <PackageCheck className="size-4" /> Confirmar recepción
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">Recepción en hub</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            {order.productName} — al confirmar, el payout del viajero queda
            liberado. Puntúa al viajero (opcional).
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
              { orderId: order.id, travelerScore: score || undefined },
              { onSuccess: () => setOpen(false) },
            )
          }
        >
          {confirm.isPending ? "Confirmando…" : "Confirmar recepción en hub"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminOperationsPage() {
  const inTransit = useAdminOrders("IN_TRANSIT");
  const readyForDelivery = useAdminOrders("READY_FOR_DELIVERY");

  return (
    <div className="space-y-10">
      <h1 className="display-sm text-ink">Operación</h1>

      <section className="space-y-3">
        <h2 className="title-md text-ink">
          En camino — esperando llegada al hub ({inTransit.data?.length ?? "…"})
        </h2>
        {inTransit.isLoading ? (
          <Skeleton className="h-24 w-full rounded-[16px]" />
        ) : (inTransit.data ?? []).length === 0 ? (
          <p className="body-md text-body-text">Ningún paquete en camino ahora.</p>
        ) : (
          inTransit.data?.map((o) => (
            <Card key={o.id} className="rounded-[16px] border-hairline bg-background shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <div>
                  <p className="title-sm text-ink">{o.productName}</p>
                  <p className="caption text-body-text">
                    {o.buyerEmail} · payout al confirmar:{" "}
                    <span className="number-display !text-[13px] text-semantic-up">
                      ${o.travelerRewardAmount.toFixed(2)}
                    </span>
                  </p>
                </div>
                <HubReceptionDialog order={o} />
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="title-md text-ink">
          En el hub — última milla pendiente ({readyForDelivery.data?.length ?? "…"})
        </h2>
        {(readyForDelivery.data ?? []).length === 0 ? (
          <p className="body-md text-body-text">Nada en el hub esperando entrega.</p>
        ) : (
          readyForDelivery.data?.map((o) => (
            <Card key={o.id} className="rounded-[16px] border-hairline bg-background shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <div>
                  <p className="title-sm text-ink">{o.productName}</p>
                  <p className="caption text-body-text">
                    Entregar a {o.buyerEmail} — el comprador confirma la recepción en su app.
                  </p>
                </div>
                <span className="caption-strong uppercase text-primary">Listo para entregar</span>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
