"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plane, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCancelTrip, useMyTrips, usePublishTrip } from "../hooks";
import { TRIP_STATUS_UI } from "../schemas";

export function TripList() {
  const query = useMyTrips();
  const publish = usePublishTrip();
  const cancel = useCancelTrip();

  const trips = query.data?.pages.flatMap((p) => p.items) ?? [];
  const busy = publish.isPending || cancel.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display-sm text-ink">Mis viajes</h1>
        <Button asChild className="h-11 rounded-full px-5 font-semibold">
          <Link href="/viajar/nuevo">
            <Plus className="size-4" /> Publicar viaje
          </Link>
        </Button>
      </div>

      {query.isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[16px]" />
          ))}
        </div>
      )}

      {query.isSuccess && trips.length === 0 && (
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-surface-strong">
              <Plane className="size-7 text-primary" />
            </span>
            <div className="space-y-1">
              <h2 className="title-md text-ink">Aún no tienes viajes</h2>
              <p className="body-md text-body-text">
                Publica tu próximo viaje y empieza a recibir encargos compatibles.
              </p>
            </div>
            <Button asChild className="h-12 rounded-full px-6 font-semibold">
              <Link href="/viajar/nuevo">Publicar mi primer viaje</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {trips.map((trip) => {
        const ui = TRIP_STATUS_UI[trip.status];
        return (
          <Card key={trip.id} className="rounded-[16px] border-hairline shadow-none">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
              <div className="space-y-1">
                <p className="title-sm text-ink">
                  Llegada:{" "}
                  <span className="number-display !text-[15px]">
                    {format(new Date(trip.arrivalDate), "d 'de' MMMM yyyy", { locale: es })}
                  </span>
                </p>
                <p className="body-sm text-body-text">
                  Capacidad:{" "}
                  <span className="number-display !text-[14px] text-ink">
                    {trip.remainingCapacity}/{trip.totalCapacity}
                  </span>{" "}
                  disponible
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    "rounded-full bg-surface-strong caption-strong uppercase",
                    ui.className,
                  )}
                >
                  {ui.label}
                </Badge>
                {trip.status === "DRAFT" && (
                  <Button
                    size="sm"
                    className="rounded-full font-semibold"
                    disabled={busy}
                    onClick={() => publish.mutate(trip.id)}
                  >
                    Publicar
                  </Button>
                )}
                {(trip.status === "DRAFT" || trip.status === "OPEN") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full font-semibold text-semantic-down"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "¿Cancelar este viaje? Sus encargos volverán a asignarse a otros viajeros.",
                        )
                      ) {
                        cancel.mutate(trip.id);
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {query.hasNextPage && (
        <div className="flex justify-center">
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
  );
}
