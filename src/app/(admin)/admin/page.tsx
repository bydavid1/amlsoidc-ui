"use client";

import { useState } from "react";
import { OrderStatusBadge } from "@/components/status/order-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOrders } from "@/features/admin/api";

const STATUSES = [
  "ALL",
  "PENDING_ASSIGNMENT",
  "ASSIGNED",
  "SOURCING",
  "IN_TRANSIT",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
];

/** La tabla que nos dice a NOSOTROS: precio + viajero + comisión + total. */
export default function AdminMoneyPage() {
  const [status, setStatus] = useState("ALL");
  const orders = useAdminOrders(status === "ALL" ? undefined : status);

  const rows = orders.data ?? [];
  const totals = rows.reduce(
    (acc, o) => ({
      commission: acc.commission + o.platformFeeAmount,
      rewards: acc.rewards + o.travelerRewardAmount,
      volume: acc.volume + o.buyerTotalAmount,
    }),
    { commission: 0, rewards: 0, volume: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display-sm text-ink">Dinero</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-56 rounded-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "Todos los estados" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Comisión Bringo (listado)", value: totals.commission },
          { label: "Pagos a viajeros (listado)", value: totals.rewards },
          { label: "Volumen total (listado)", value: totals.volume },
        ].map((kpi) => (
          <Card key={kpi.label} className="rounded-[16px] border-hairline bg-background shadow-none">
            <CardContent className="px-6 py-5">
              <p className="caption text-body-text">{kpi.label}</p>
              <p className="number-display !text-[24px] text-ink">${kpi.value.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[16px]" />
      ) : (
        <Card className="rounded-[16px] border-hairline bg-background shadow-none">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {["Producto", "Comprador", "Estado", "Precio", "Viajero", "Bringo", "Total"].map(
                    (h) => (
                      <th key={h} className="caption-strong px-5 py-3 uppercase text-body-text">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-b border-hairline-soft">
                    <td className="body-sm max-w-40 truncate px-5 py-3 font-medium text-ink">
                      {o.productName}
                    </td>
                    <td className="body-sm max-w-44 truncate px-5 py-3 text-body-text">
                      {o.buyerEmail}
                    </td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={o.fulfillmentStatus ?? o.status} />
                    </td>
                    <td className="number-display !text-[13px] px-5 py-3">
                      ${o.estimatedPriceAmount.toFixed(2)}
                    </td>
                    <td className="number-display !text-[13px] px-5 py-3 text-semantic-up">
                      ${o.travelerRewardAmount.toFixed(2)}
                    </td>
                    <td className="number-display !text-[13px] px-5 py-3 text-primary">
                      ${o.platformFeeAmount.toFixed(2)}
                    </td>
                    <td className="number-display !text-[13px] px-5 py-3 font-semibold">
                      ${o.buyerTotalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="body-md px-5 py-8 text-center text-body-text">
                      Sin pedidos con ese filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
