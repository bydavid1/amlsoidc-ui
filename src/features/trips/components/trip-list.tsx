"use client";

import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Plane, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { assignmentsApi } from "@/features/assignments/api";
import { cn } from "@/lib/utils";
import { useMyAssignments } from "@/features/assignments/hooks";
import { geographyApi, useCorridors } from "@/features/geography/api";
import { useCancelTrip, useCloseTrip, useMyTrips, usePublishTrip } from "../hooks";
import { TRIP_STATUS_UI } from "../schemas";

function isoToFlag(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function TripList() {
  const query = useMyTrips();
  const publish = usePublishTrip();
  const close = useCloseTrip();
  const cancel = useCancelTrip();
  const assignments = useMyAssignments();
  const corridors = useCorridors();

  const trips = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const busy = publish.isPending || close.isPending || cancel.isPending;

  const countryById = useMemo(() => {
    const map = new Map<string, { name: string; iso2: string }>();
    for (const corridor of corridors.data ?? []) {
      map.set(corridor.origin.id, {
        name: corridor.origin.name,
        iso2: corridor.origin.iso2,
      });
      map.set(corridor.destination.id, {
        name: corridor.destination.name,
        iso2: corridor.destination.iso2,
      });
    }
    return map;
  }, [corridors.data]);

  const destinationCountryIds = useMemo(
    () => Array.from(new Set(trips.map((trip) => trip.destinationCountryId))),
    [trips],
  );

  const cityQueries = useQueries({
    queries: destinationCountryIds.map((countryId) => ({
      queryKey: ["geography", "cities", countryId],
      queryFn: () => geographyApi.listCities(countryId),
      staleTime: 5 * 60_000,
    })),
  });

  const cityNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const queryResult of cityQueries) {
      for (const city of queryResult.data ?? []) {
        map.set(city.id, city.name);
      }
    }
    return map;
  }, [cityQueries]);

  const openTripIds = useMemo(
    () => trips.filter((trip) => trip.status === "OPEN").map((trip) => trip.id),
    [trips],
  );

  const availableQueries = useQueries({
    queries: openTripIds.map((tripId) => ({
      queryKey: ["assignments", "available", tripId],
      queryFn: () => assignmentsApi.listAvailableOrders(tripId),
      refetchInterval: 30_000,
    })),
  });

  const availableByTripId = useMemo(() => {
    const map = new Map<string, (typeof availableQueries)[number]>();
    openTripIds.forEach((tripId, index) => {
      const result = availableQueries[index];
      if (result) map.set(tripId, result);
    });
    return map;
  }, [availableQueries, openTripIds]);

  // encargos activos por viaje (para que cada card muestre su carga)
  const countByTrip = new Map<string, number>();
  for (const a of assignments.data ?? []) {
    if (a.status === "ACCEPTED") {
      countByTrip.set(a.tripId, (countByTrip.get(a.tripId) ?? 0) + 1);
    }
  }

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
        const claimed = countByTrip.get(trip.id) ?? 0;
        const origin = countryById.get(trip.originCountryId);
        const destination = countryById.get(trip.destinationCountryId);
        const destinationCityName = trip.destinationCityId
          ? cityNameById.get(trip.destinationCityId) ?? "Cargando ciudad..."
          : "Sin especificar";

        const available = availableByTripId.get(trip.id);
        const compatibleCount = available?.data?.length ?? 0;

        const canViewAssignments =
          trip.status === "OPEN" || trip.status === "CLOSED" || trip.status === "IN_PROGRESS";

        let matchSummary = "";
        if (trip.status === "OPEN") {
          if (available?.isLoading) {
            matchSummary = "Buscando encargos compatibles...";
          } else if (compatibleCount > 0) {
            matchSummary = `${compatibleCount} encargo${compatibleCount > 1 ? "s" : ""} compatibles`;
          } else {
            matchSummary = "Aún no hay encargos compatibles";
          }
        } else if (claimed > 0) {
          matchSummary = `${claimed} encargo${claimed > 1 ? "s" : ""} en curso`;
        } else {
          matchSummary = "Sin encargos activos";
        }

        return (
          <Card key={trip.id} className="rounded-[16px] border-hairline shadow-none">
            <CardContent className="space-y-4 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="title-sm text-ink">
                    {origin ? `${isoToFlag(origin.iso2)} ${origin.name}` : "Origen"} {"->"}{" "}
                    {destination
                      ? `${isoToFlag(destination.iso2)} ${destination.name}`
                      : "Destino"}
                  </p>
                  <div className="space-y-1">
                    <p className="body-sm text-body-text">
                      <span className="caption-strong text-ink">Llegada:</span>{" "}
                      <span className="number-display !text-[15px]">
                        {format(new Date(trip.arrivalDate), "d 'de' MMMM yyyy", { locale: es })}
                      </span>
                    </p>
                    <p className="body-sm text-body-text">
                      <span className="caption-strong text-ink">Destino:</span> {destinationCityName}
                    </p>
                    <p className="body-sm text-body-text">
                      <span className="caption-strong text-ink">Estado:</span> {ui.label}
                    </p>
                    <p className="body-sm text-body-text">{matchSummary}</p>
                  </div>
                </div>

                <Badge
                  className={cn(
                    "rounded-full bg-surface-strong caption-strong uppercase",
                    ui.className,
                  )}
                >
                  {ui.label}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canViewAssignments && (
                  <Button asChild size="sm" className="rounded-full font-semibold">
                    <Link href={`/viajar/${trip.id}/encargos`}>Ver encargos</Link>
                  </Button>
                )}

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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-9 rounded-full"
                        aria-label="Más acciones"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem disabled>Editar viaje (próximamente)</DropdownMenuItem>
                      {trip.status === "OPEN" && (
                        <DropdownMenuItem
                          onClick={() => close.mutate(trip.id)}
                          disabled={busy}
                        >
                          Cerrar viaje
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (
                            window.confirm(
                              "¿Cancelar este viaje? Sus encargos volverán a asignarse a otros viajeros.",
                            )
                          ) {
                            cancel.mutate(trip.id);
                          }
                        }}
                        disabled={busy}
                      >
                        Cancelar viaje
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
