"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireRole } from "@/components/layout/require-role";
import { AvailableOrders } from "@/features/assignments/components/available-orders";

export default function TripAvailableOrdersPage() {
  const params = useParams<{ tripId: string }>();

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
          <div className="space-y-2">
            <h1 className="display-sm text-ink">Encargos disponibles</h1>
            <p className="body-md text-body-text">
              Elige los que te quepan: tú decides. La ganancia que ves es lo que
              recibirás por cada entrega completada.
            </p>
          </div>
        </div>
        <AvailableOrders tripId={params.tripId} />
      </div>
    </RequireRole>
  );
}
