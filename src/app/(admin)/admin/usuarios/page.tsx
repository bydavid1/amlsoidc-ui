"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers, useReactivateUser, useSuspendUser } from "@/features/admin/api";

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const users = useAdminUsers(q);
  const suspend = useSuspendUser();
  const reactivate = useReactivateUser();

  return (
    <div className="space-y-6">
      <h1 className="display-sm text-ink">Usuarios</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por email, nombre o teléfono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 rounded-full bg-background pl-11"
        />
      </div>

      {users.isLoading ? (
        <Skeleton className="h-48 w-full rounded-[16px]" />
      ) : (
        <div className="space-y-2">
          {users.data?.map((u) => (
            <Card key={u.id} className="rounded-[16px] border-hairline bg-background shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="title-sm truncate text-ink">
                    {u.firstName ?? "(sin nombre)"}{" "}
                    <span className="body-sm font-normal text-body-text">{u.email}</span>
                  </p>
                  <p className="caption text-body-text">
                    {u.phone && (
                      <span className="number-display !text-[12px]">{u.phone} · </span>
                    )}
                    {u.roles.length > 0 ? u.roles.join(", ") : "sin roles"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      u.status === "ACTIVE"
                        ? "rounded-full bg-surface-strong caption-strong text-semantic-up"
                        : "rounded-full bg-surface-strong caption-strong text-semantic-down"
                    }
                  >
                    {u.status === "ACTIVE" ? "Activo" : "Suspendido"}
                  </Badge>
                  {u.status === "ACTIVE" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full font-semibold text-semantic-down"
                      disabled={suspend.isPending}
                      onClick={() => {
                        if (window.confirm(`¿Suspender a ${u.email}? Bloqueo inmediato.`)) {
                          suspend.mutate(u.id);
                        }
                      }}
                    >
                      Suspender
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full font-semibold"
                      disabled={reactivate.isPending}
                      onClick={() => reactivate.mutate(u.id)}
                    >
                      Reactivar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {users.data?.length === 0 && (
            <p className="body-md text-body-text">Sin resultados para “{q}”.</p>
          )}
        </div>
      )}
    </div>
  );
}
