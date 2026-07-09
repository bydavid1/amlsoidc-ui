"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireRole } from "@/components/layout/require-role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailableOrders } from "@/features/assignments/components/available-orders";
import { EngagementCard } from "@/features/assignments/components/assignment-board";
import { useMyAssignments } from "@/features/assignments/hooks";
import { TRIP_STATUS_UI } from "@/features/trips/schemas";
import { useCloseTrip, useTrip } from "@/features/trips/hooks";
import { cn } from "@/lib/utils";

/**
 * Hub del viaje: sus encargos en curso + (si sigue OPEN) los disponibles
 * para reclamar. Al cerrar el viaje, la pantalla queda solo en modo
 * seguimiento (cerrar ≠ cancelar).
 */
export default function TripOrdersHubPage() {
  const params = useParams<{ tripId: string }>();
  const trip = useTrip(params.tripId);
  const assignments = useMyAssignments();
  const close = useCloseTrip();

  const claimed = (assignments.data ?? []).filter(
    (a) => a.tripId === params.tripId && a.status === "ACCEPTED",
  );

  return (
    <RequireRole role="TRAVELER">
      <div className="mx-auto max-w-[900px] space-y-8 px-6 py-12">
        <div className="space-y-4">
          <Link
            href="/viajar"
            className="inline-flex items-center gap-1 body-sm font-medium text-body-text hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Mis viajes
          </Link>

          {trip.isLoading ? (
            <Skeleton className="h-16 w-full max-w-md rounded-[16px]" />
          ) : trip.data ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="display-sm text-ink">
                  Viaje del{" "}
                  {format(new Date(trip.data.arrivalDate), "d 'de' MMMM", { locale: es })}
                </h1>
                <Badge
                  className={cn(
                    "rounded-full bg-surface-strong caption-strong uppercase",
                    TRIP_STATUS_UI[trip.data.status].className,
                  )}
                >
                  {TRIP_STATUS_UI[trip.data.status].label}
                </Badge>
              </div>
              {trip.data.status === "OPEN" && (
                <Button
                  variant="secondary"
                  className="rounded-full font-semibold"
                  disabled={close.isPending}
                  onClick={() => close.mutate(params.tripId)}
                >
                  <Lock className="size-4" /> Ya tomé mis encargos — cerrar viaje
                </Button>
              )}
            </div>
          ) : (
            <p className="body-md text-semantic-down">No encontramos este viaje.</p>
          )}
        </div>

        {/* encargos ya reclamados para ESTE viaje */}
        <section className="space-y-3">
          <h2 className="title-md text-ink">
            Encargos de este viaje{" "}
            <span className="number-display !text-[16px] text-body-text">
              ({claimed.length})
            </span>
          </h2>
          {claimed.length === 0 ? (
            <Card className="rounded-[16px] border-hairline shadow-none">
              <CardContent className="px-6 py-5">
                <p className="body-md text-body-text">
                  Aún no has reclamado encargos para este viaje.
                </p>
              </CardContent>
            </Card>
          ) : (
            claimed.map((a) => <EngagementCard key={a.id} assignment={a} />)
          )}
        </section>

        {/* disponibles: solo mientras el viaje siga abierto */}
        {trip.data?.status === "OPEN" && (
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="title-md text-ink">Disponibles para llevar</h2>
              <p className="body-sm text-body-text">
                Revisa el tamaño, decide si te cabe y gana por cada entrega. El
                primero que reclama se lo lleva. Se actualiza cada 30 segundos.
              </p>
            </div>
            <AvailableOrders tripId={params.tripId} />
          </section>
        )}

        {trip.data?.status === "CLOSED" && (
          <p className="body-sm text-muted-foreground">
            Viaje cerrado: ya no se muestran encargos disponibles. Tus encargos
            activos siguen su curso normal.
          </p>
        )}
      </div>
    </RequireRole>
  );
}
