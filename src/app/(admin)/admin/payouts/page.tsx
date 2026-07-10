"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMarkPayoutPaid,
  useMarkRefunded,
  usePayouts,
  useRefunds,
} from "@/features/admin/api";

export default function AdminPayoutsPage() {
  const due = usePayouts("DUE");
  const paid = usePayouts("PAID_OUT");
  const refunds = useRefunds();
  const markPaid = useMarkPayoutPaid();
  const markRefunded = useMarkRefunded();

  return (
    <div className="space-y-10">
      <h1 className="display-sm text-ink">Payouts y reembolsos</h1>

      <section className="space-y-3">
        <h2 className="title-md text-ink">
          Pagar a viajeros ({due.data?.length ?? "…"})
        </h2>
        {due.isLoading ? (
          <Skeleton className="h-24 w-full rounded-[16px]" />
        ) : (due.data ?? []).length === 0 ? (
          <p className="body-md text-body-text">Sin payouts pendientes. 🎉</p>
        ) : (
          due.data?.map((p) => (
            <Card key={p.paymentId} className="rounded-[16px] border-hairline bg-background shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <div>
                  <p className="title-sm text-ink">
                    {p.travelerFirstName ?? "Viajero"} —{" "}
                    <span className="number-display !text-[15px] text-semantic-up">
                      ${p.rewardAmount.toFixed(2)}
                    </span>
                  </p>
                  <p className="caption text-body-text">
                    {p.productName}
                    {p.travelerPhone && (
                      <>
                        {" · "}
                        <span className="number-display !text-[12px]">{p.travelerPhone}</span>
                      </>
                    )}
                  </p>
                </div>
                <Button
                  className="h-11 rounded-full px-5 font-semibold"
                  disabled={markPaid.isPending}
                  onClick={() => markPaid.mutate(p.paymentId)}
                >
                  Ya le pagué
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="title-md text-ink">Reembolsos pendientes ({refunds.data?.length ?? "…"})</h2>
        {(refunds.data ?? []).length === 0 ? (
          <p className="body-md text-body-text">Sin reembolsos pendientes.</p>
        ) : (
          refunds.data?.map((r) => (
            <Card key={r.paymentId} className="rounded-[16px] border-hairline bg-background shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                <p className="title-sm text-ink">
                  Pedido {r.orderId.slice(0, 8)} —{" "}
                  <span className="number-display !text-[15px] text-semantic-down">
                    ${r.amount.toFixed(2)} {r.currency}
                  </span>
                </p>
                <Button
                  variant="secondary"
                  className="h-11 rounded-full px-5 font-semibold"
                  disabled={markRefunded.isPending}
                  onClick={() => markRefunded.mutate(r.paymentId)}
                >
                  Reembolso ejecutado
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="title-sm text-body-text">Historial de payouts</h2>
        {paid.data?.map((p) => (
          <div
            key={p.paymentId}
            className="flex items-center justify-between rounded-[12px] bg-background px-5 py-3"
          >
            <span className="body-sm text-body-text">
              {p.travelerFirstName ?? "Viajero"} · {p.productName}
            </span>
            <span className="number-display !text-[13px] text-body-text">
              ${p.rewardAmount.toFixed(2)} ✓
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
