"use client";

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
import { Dispute, useDisputes, useResolveDispute } from "@/features/admin/api";

function ResolveDialog({ dispute }: { dispute: Dispute }) {
  const [open, setOpen] = useState(false);
  const resolve = useResolveDispute();

  const act = (
    resolution: "RESOLVED" | "REJECTED",
    orderOutcome: "CANCEL_ORDER" | "RESUME_ORDER",
  ) =>
    resolve.mutate(
      { disputeId: dispute.id, resolution, orderOutcome },
      { onSuccess: () => setOpen(false) },
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full px-5 font-semibold">Resolver</Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">Resolver disputa</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            “{dispute.reason}”
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            className="h-12 w-full rounded-full font-semibold"
            disabled={resolve.isPending}
            onClick={() => act("RESOLVED", "RESUME_ORDER")}
          >
            Resuelta — el pedido continúa
          </Button>
          <Button
            variant="secondary"
            className="h-12 w-full rounded-full font-semibold text-semantic-down"
            disabled={resolve.isPending}
            onClick={() => act("RESOLVED", "CANCEL_ORDER")}
          >
            Resuelta — cancelar el pedido
          </Button>
          <Button
            variant="ghost"
            className="h-12 w-full rounded-full font-semibold text-body-text"
            disabled={resolve.isPending}
            onClick={() => act("REJECTED", "RESUME_ORDER")}
          >
            Rechazar disputa — el pedido continúa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDisputesPage() {
  const open = useDisputes("OPEN");
  const closed = useDisputes("RESOLVED");

  return (
    <div className="space-y-10">
      <h1 className="display-sm text-ink">Disputas</h1>

      <section className="space-y-3">
        <h2 className="title-md text-ink">Abiertas ({open.data?.length ?? "…"})</h2>
        {open.isLoading ? (
          <Skeleton className="h-24 w-full rounded-[16px]" />
        ) : (open.data ?? []).length === 0 ? (
          <p className="body-md text-body-text">Sin disputas abiertas. 🎉</p>
        ) : (
          open.data?.map((d) => (
            <Card key={d.id} className="rounded-[16px] border-semantic-down/30 bg-background shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <div className="min-w-0">
                  <p className="body-md font-medium text-ink">“{d.reason}”</p>
                  <p className="caption text-body-text">Pedido {d.orderId.slice(0, 8)}</p>
                </div>
                <ResolveDialog dispute={d} />
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="title-sm text-body-text">Resueltas recientemente</h2>
        {closed.data?.map((d) => (
          <div key={d.id} className="rounded-[12px] bg-background px-5 py-3">
            <p className="body-sm text-body-text">“{d.reason}”</p>
          </div>
        ))}
      </section>
    </div>
  );
}
