"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-[720px] space-y-6 px-6 py-12">
      <h1 className="display-sm text-ink">Mi cuenta</h1>
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
