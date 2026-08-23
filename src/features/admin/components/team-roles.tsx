"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminUser, useAdminUsers, useSetTeamRoles } from "@/features/admin/api";
import { TEAM_ROLES, teamRoleLabel } from "@/features/admin/roles";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";

function RoleChip({
  user,
  role,
  isSelf,
}: {
  user: AdminUser;
  role: string;
  isSelf: boolean;
}) {
  const setRoles = useSetTeamRoles();
  const active = user.roles.includes(role);
  const currentTeamRoles = user.roles.filter((r) => (TEAM_ROLES as string[]).includes(r));
  const lockedAdminOnSelf = isSelf && role === "ADMIN";

  return (
    <button
      type="button"
      disabled={setRoles.isPending || lockedAdminOnSelf}
      title={lockedAdminOnSelf ? "No podés quitarte tu propio rol Admin" : undefined}
      onClick={() => {
        const next = active
          ? currentTeamRoles.filter((r) => r !== role)
          : [...currentTeamRoles, role];
        setRoles.mutate({ userId: user.id, roles: next });
      }}
      className={cn(
        "rounded-full border px-3 py-1.5 caption-strong transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-hairline bg-background text-body-text hover:border-primary/40",
      )}
    >
      {teamRoleLabel(role)}
    </button>
  );
}

export function TeamRoles() {
  const [q, setQ] = useState("");
  const users = useAdminUsers(q);
  const { user: me } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-sm text-ink">Equipo</h1>
        <p className="body-sm text-body-text">
          Asigná o quitá roles internos: Admin, Operación, Soporte de disputas, Riesgo/Legal.
        </p>
      </div>

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
              <CardContent className="space-y-3 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="title-sm truncate text-ink">
                      {u.firstName ?? "(sin nombre)"}{" "}
                      <span className="body-sm font-normal text-body-text">{u.email}</span>
                    </p>
                    <p className="caption text-body-text">
                      {u.roles.filter((r) => !(TEAM_ROLES as string[]).includes(r)).join(", ") ||
                        "sin roles de cliente"}
                    </p>
                  </div>
                  {u.status !== "ACTIVE" && (
                    <Badge className="rounded-full bg-surface-strong caption-strong text-semantic-down">
                      Suspendido
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {TEAM_ROLES.map((role) => (
                    <RoleChip key={role} user={u} role={role} isSelf={u.id === me?.id} />
                  ))}
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
