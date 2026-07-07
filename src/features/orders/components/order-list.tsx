"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { OrderStatusBadge } from "@/components/status/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyOrders } from "../hooks";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING_ASSIGNMENT", label: "Buscando viajero" },
  { value: "ASSIGNED", label: "Asignados" },
  { value: "SOURCING", label: "En preparación" },
  { value: "IN_TRANSIT", label: "En camino" },
  { value: "READY_FOR_DELIVERY", label: "Por entregar" },
  { value: "DELIVERED", label: "Entregados" },
  { value: "COMPLETED", label: "Completados" },
  { value: "CANCELLED", label: "Cancelados" },
];

export function OrderList() {
  const [status, setStatus] = useState<string>("ALL");
  const query = useMyOrders(status === "ALL" ? undefined : status);

  const orders = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display-sm text-ink">Mis pedidos</h1>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 w-48 rounded-full bg-surface-strong">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild className="h-11 rounded-full px-5 font-semibold">
            <Link href="/comprar/nuevo">
              <Plus className="size-4" /> Nuevo pedido
            </Link>
          </Button>
        </div>
      </div>

      {query.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[16px]" />
          ))}
        </div>
      )}

      {query.isError && (
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="body-md text-semantic-down">No pudimos cargar tus pedidos.</p>
            <Button variant="secondary" className="rounded-full" onClick={() => query.refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {query.isSuccess && orders.length === 0 && (
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-surface-strong">
              <Package className="size-7 text-primary" />
            </span>
            <div className="space-y-1">
              <h2 className="title-md text-ink">Aún no tienes pedidos</h2>
              <p className="body-md text-body-text">
                Pide un producto de otro país y un viajero verificado te lo trae.
              </p>
            </div>
            <Button asChild className="h-12 rounded-full px-6 font-semibold">
              <Link href="/comprar/nuevo">Crear mi primer pedido</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/comprar/${order.id}`} className="block">
              <Card className="rounded-[16px] border-hairline shadow-none transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0 space-y-1">
                    <p className="title-sm truncate text-ink">{order.productName}</p>
                    <p className="caption text-muted-foreground number-display !text-[13px]">
                      {format(new Date(order.createdAt), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <OrderStatusBadge
                    status={
                      order.status === "SOURCING" && order.fulfillmentStatus
                        ? order.fulfillmentStatus
                        : order.status
                    }
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
          {query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                className="rounded-full px-6"
                disabled={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "Cargando…" : "Cargar más"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
