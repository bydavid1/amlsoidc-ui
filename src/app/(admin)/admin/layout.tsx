"use client";

import {
  Ban,
  DollarSign,
  IdCard,
  LayoutDashboard,
  PackageCheck,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/layout/require-auth";
import { Button } from "@/components/ui/button";
import { TEAM_ROLES } from "@/features/admin/roles";
import { useAuth } from "@/features/auth/auth-provider";
import { Role } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";

/** "ANY" = cualquier rol de equipo alcanza (hoy solo la home lo usa). */
type NavRole = Role | "ANY";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; role: NavRole }[] = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, role: "ANY" },
  { href: "/admin/operacion", label: "Operación", icon: PackageCheck, role: "OPS_AGENT" },
  { href: "/admin/dinero", label: "Dinero", icon: DollarSign, role: "ADMIN" },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet, role: "ADMIN" },
  { href: "/admin/disputas", label: "Disputas", icon: ShieldAlert, role: "SOPORTE_DISPUTAS" },
  { href: "/admin/kyc", label: "KYC", icon: IdCard, role: "RIESGO_LEGAL" },
  { href: "/admin/blocklist", label: "Blocklist", icon: Ban, role: "RIESGO_LEGAL" },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, role: "RIESGO_LEGAL" },
  { href: "/admin/configuracion", label: "Configuración", icon: SlidersHorizontal, role: "ADMIN" },
  { href: "/admin/curaduria", label: "Curaduría", icon: Sparkles, role: "ADMIN" },
  { href: "/admin/equipo", label: "Equipo", icon: UserCog, role: "ADMIN" },
];

/** Sección de /admin cuyo rol gatea el pathname actual (match por segmento, no exacto — cubre rutas dinámicas como /admin/kyc/[caseId]). */
function requiredRoleFor(pathname: string): NavRole {
  const match = [...NAV].sort((a, b) => b.href.length - a.href.length).find((item) => {
    if (item.href === "/admin") return pathname === "/admin";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
  return match?.role ?? "ADMIN";
}

/** Consola de operación de Bringo — un rol de equipo, cada sección gateada por el suyo (ADMIN ve todo). */
function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, hasRole, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isTeamMember = TEAM_ROLES.some(hasRole);

  if (!isTeamMember) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-6 py-24 text-center">
        <h1 className="display-sm text-ink">Acceso restringido</h1>
        <p className="body-md text-body-text">
          Esta sección es solo para el equipo de Bringo.
        </p>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/comprar">Volver a la app</Link>
        </Button>
      </div>
    );
  }

  const visibleNav = NAV.filter(
    (item) => item.role === "ANY" || hasRole("ADMIN") || hasRole(item.role),
  );
  const requiredRole = requiredRoleFor(pathname);
  const canAccessSection =
    requiredRole === "ANY" || hasRole("ADMIN") || hasRole(requiredRole);

  return (
    <div className="flex min-h-screen bg-surface-soft">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-background p-5 sm:flex">
        <Link href="/admin" className="title-md mb-8 font-bold text-primary">
          bringo <span className="caption-strong uppercase text-ink">ops</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-body-text hover:bg-surface-strong hover:text-ink",
              )}
            >
              <item.icon className="size-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-hairline-soft pt-4">
          <p className="caption truncate text-muted-foreground">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-body-text"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden px-6 py-10 sm:px-10">
        {canAccessSection ? (
          children
        ) : (
          <div className="mx-auto max-w-md space-y-4 py-24 text-center">
            <h1 className="display-sm text-ink">No tienes acceso a esta sección</h1>
            <p className="body-md text-body-text">
              Tu rol no incluye esta parte del panel. Elegí una de las tuyas:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {visibleNav.map((item) => (
                <Button key={item.href} asChild variant="secondary" size="sm" className="rounded-full">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
