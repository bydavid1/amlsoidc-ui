"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SIZE_UI } from "@/features/orders/schemas";
import { useAvailableOrders, useClaimOrder } from "../hooks";

/**
 * Encargos disponibles para UN viaje (modelo discovery+claim): el viajero ve
 * producto, tamaño y ganancia, y decide qué le cabe. El primero que reclama gana.
 */
export function AvailableOrders({ tripId }: { tripId: string }) {
  const query = useAvailableOrders(tripId);
  const claim = useClaimOrder(tripId);

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[16px]" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="body-md text-semantic-down">
            No pudimos cargar los encargos (¿el viaje está publicado?).
          </p>
          <Button variant="secondary" className="rounded-full" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const orders = query.data ?? [];

  if (orders.length === 0) {
    return (
      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-surface-strong">
            <PackageSearch className="size-7 text-primary" />
          </span>
          <div className="space-y-1">
            <h2 className="title-md text-ink">No hay encargos disponibles ahora</h2>
            <p className="body-md text-body-text">
              Cuando alguien pida algo en tu ruta, aparecerá aquí. Revisamos cada 30 segundos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const sizeUi = SIZE_UI[order.sizeCategory];
        return (
          <Card key={order.id} className="rounded-[16px] border-hairline shadow-none">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
              <div className="min-w-0 space-y-1.5">
                <p className="title-sm truncate text-ink">{order.productName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-surface-strong caption-strong text-ink">
                    {sizeUi.label}
                  </Badge>
                  <span className="caption text-body-text">{sizeUi.examples}</span>
                </div>
                <p className="caption text-muted-foreground">
                  Valor{" "}
                  <span className="number-display !text-[13px] text-ink">
                    ${order.estimatedPriceAmount.toFixed(2)}
                  </span>
                  {order.neededBy && (
                    <>
                      {" · "}lo necesitan antes del{" "}
                      <span className="number-display !text-[13px]">
                        {format(new Date(order.neededBy), "d MMM", { locale: es })}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="caption text-muted-foreground">Ganas</p>
                  <p className="number-display !text-[20px] text-semantic-up">
                    ${order.travelerRewardAmount.toFixed(2)}
                  </p>
                </div>
                <Button
                  className="h-11 rounded-full px-5 font-semibold"
                  disabled={claim.isPending}
                  onClick={() => claim.mutate(order.id)}
                >
                  Lo llevo
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
