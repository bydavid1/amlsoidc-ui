import type { Metadata } from "next";
import { RequireRole } from "@/components/layout/require-role";
import { CreateTripForm } from "@/features/trips/components/create-trip-form";

export const metadata: Metadata = { title: "Publicar viaje" };

export default function NewTripPage() {
  return (
    <RequireRole role="TRAVELER">
      <div className="mx-auto max-w-[640px] space-y-8 px-6 py-12">
        <div className="space-y-2">
          <h1 className="display-sm text-ink">Publicar viaje</h1>
          <p className="body-md text-body-text">
            Indica tu ruta, cuándo llegas y cuántos pedidos puedes llevar. Te
            ofreceremos encargos compatibles automáticamente.
          </p>
        </div>
        <CreateTripForm />
      </div>
    </RequireRole>
  );
}
