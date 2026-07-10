"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { ProfileForm } from "@/features/auth/components/profile-form";

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-[720px] space-y-6 px-6 py-12">
      <h1 className="display-sm text-ink">Mi cuenta</h1>

      {user && !user.hasCompleteProfile && (
        <div className="rounded-[16px] border border-primary/30 bg-primary/5 px-5 py-4">
          <p className="body-md font-semibold text-ink">Completa tu perfil para operar</p>
          <p className="body-sm text-body-text">
            Necesitamos tu nombre y teléfono para coordinar tus pedidos y viajes.
          </p>
        </div>
      )}

      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="p-8">
          <h2 className="title-md mb-5 text-ink">Perfil</h2>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card className="rounded-[24px] border-hairline shadow-none">
        <CardContent className="space-y-4 p-8">
          <div className="flex items-baseline justify-between border-b border-hairline-soft pb-3">
            <span className="body-sm text-body-text">Correo</span>
            <span className="title-sm text-ink">{user?.email}</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-hairline-soft pb-3">
            <span className="body-sm text-body-text">Perfiles activos</span>
            <span className="flex gap-2">
              {user?.roles.length ? (
                user.roles.map((role) => (
                  <Badge key={role} className="rounded-full bg-surface-strong text-ink caption-strong">
                    {role === "BUYER" ? "Comprador" : role === "TRAVELER" ? "Viajero" : role}
                  </Badge>
                ))
              ) : (
                <span className="body-sm text-muted-foreground">Ninguno todavía</span>
              )}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="body-sm text-body-text">Estado</span>
            <span
              className={
                user?.status === "ACTIVE"
                  ? "title-sm text-semantic-up"
                  : "title-sm text-semantic-down"
              }
            >
              {user?.status === "ACTIVE" ? "Activa" : "Suspendida"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
