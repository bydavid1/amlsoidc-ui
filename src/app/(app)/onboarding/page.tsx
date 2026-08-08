"use client";

import { Package, Plane } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { profilesApi } from "@/features/profiles/api";

/**
 * Onboarding: activa uno o ambos perfiles. Un mismo usuario puede ser
 * Buyer y Traveler a la vez (decisión de dominio del backend).
 */
export default function OnboardingPage() {
  const { user, hasRole, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/comprar";
  const [busy, setBusy] = useState<"BUYER" | "TRAVELER" | null>(null);

  if (user && !user.hasCompleteProfile) {
    return (
      <div className="mx-auto max-w-[720px] space-y-8 px-6 py-16">
        <div className="space-y-3 text-center">
          <h1 className="display-md text-ink">Antes de continuar, completa tu perfil</h1>
          <p className="body-md text-body-text">
            Necesitamos tu nombre y teléfono para coordinar pedidos y entregas.
          </p>
        </div>

        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <ProfileForm />
            <p className="body-sm text-body-text">
              Cuando guardes tu perfil, aquí mismo verás la activación de comprador y viajero.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function activate(kind: "BUYER" | "TRAVELER") {
    setBusy(kind);
    try {
      if (kind === "BUYER") {
        await profilesApi.activateBuyer();
      } else {
        await profilesApi.activateTraveler();
      }
      await refreshUser();
      toast.success(kind === "BUYER" ? "Perfil de comprador activo" : "Perfil de viajero activo");
      router.push(kind === "BUYER" ? "/comprar" : "/viajar");
    } catch {
      toast.error("No pudimos activar el perfil. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-10 px-6 py-16">
      <div className="space-y-3 text-center">
        <h1 className="display-md text-ink">¿Qué quieres hacer en Bringo?</h1>
        <p className="body-md text-body-text">
          {user?.email} — puedes activar ambos perfiles cuando quieras.
        </p>
        <div>
          <Button
            variant="ghost"
            className="h-10 rounded-full px-5"
            onClick={() => router.push(nextPath)}
          >
            Continuar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="flex flex-col gap-4 p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-strong">
              <Package className="size-6 text-primary" />
            </span>
            <h2 className="title-md text-ink">Quiero comprar</h2>
            <p className="body-md text-body-text flex-1">
              Pide productos de otro país y un viajero verificado te los trae.
              El sistema elige al mejor viajero por ti.
            </p>
            {hasRole("BUYER") ? (
              <Button
                variant="secondary"
                className="h-12 rounded-full font-semibold"
                onClick={() => router.push("/comprar")}
              >
                Ir a mis pedidos
              </Button>
            ) : (
              <Button
                className="h-12 rounded-full font-semibold"
                disabled={busy !== null}
                onClick={() => activate("BUYER")}
              >
                {busy === "BUYER" ? "Activando…" : "Activar perfil de comprador"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="flex flex-col gap-4 p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-strong">
              <Plane className="size-6 text-primary" />
            </span>
            <h2 className="title-md text-ink">Quiero viajar</h2>
            <p className="body-md text-body-text flex-1">
              Publica tu viaje, lleva encargos compatibles
              con tu capacidad y gana reputación.
            </p>
            {hasRole("TRAVELER") ? (
              <Button
                variant="secondary"
                className="h-12 rounded-full font-semibold"
                onClick={() => router.push("/viajar")}
              >
                Ir a mis viajes
              </Button>
            ) : (
              <Button
                className="h-12 rounded-full font-semibold"
                disabled={busy !== null}
                onClick={() => activate("TRAVELER")}
              >
                {busy === "TRAVELER" ? "Activando…" : "Activar perfil de viajero"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
