"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { Role } from "@/features/auth/schemas";
import { profilesApi } from "@/features/profiles/api";

const COPY: Record<"BUYER" | "TRAVELER", { title: string; body: string; cta: string }> = {
  BUYER: {
    title: "Activa tu perfil de comprador",
    body: "Para crear pedidos necesitas activar el perfil de comprador. Es gratis y toma un segundo.",
    cta: "Activar perfil de comprador",
  },
  TRAVELER: {
    title: "Activa tu perfil de viajero",
    body: "Para publicar viajes y recibir encargos necesitas activar el perfil de viajero.",
    cta: "Activar perfil de viajero",
  },
};

/**
 * Guard de espacio: si el usuario no tiene el rol, ofrece activarlo en el
 * momento (la activación es idempotente y otorga el rol en el backend).
 */
export function RequireRole({
  role,
  children,
}: {
  role: Extract<Role, "BUYER" | "TRAVELER">;
  children: React.ReactNode;
}) {
  const { hasRole, refreshUser } = useAuth();
  const router = useRouter();
  const [activating, setActivating] = useState(false);

  if (hasRole(role)) return <>{children}</>;

  const copy = COPY[role];

  async function activate() {
    setActivating(true);
    try {
      if (role === "BUYER") {
        await profilesApi.activateBuyer();
      } else {
        await profilesApi.activateTraveler();
      }
      await refreshUser();
      toast.success("Perfil activado");
      router.refresh();
    } catch {
      toast.error("No pudimos activar el perfil. Intenta de nuevo.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <h2 className="display-sm text-ink">{copy.title}</h2>
      <p className="body-md text-body-text">{copy.body}</p>
      <Button
        onClick={activate}
        disabled={activating}
        className="h-12 rounded-full px-8 text-base font-semibold"
      >
        {activating ? "Activando…" : copy.cta}
      </Button>
    </div>
  );
}
