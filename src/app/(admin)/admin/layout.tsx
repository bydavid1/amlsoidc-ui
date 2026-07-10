"use client";

import {
  Banknote,
  LayoutDashboard,
  PackageCheck,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/layout/require-auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dinero", icon: LayoutDashboard },
  { href: "/admin/operacion", label: "Operación", icon: PackageCheck },
  { href: "/admin/payouts", label: "Payouts", icon: Banknote },
  { href: "/admin/disputas", label: "Disputas", icon: ShieldAlert },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/curaduria", label: "Curaduría", icon: Sparkles },
];

/** Consola de operación de Bringo — solo rol ADMIN. */
function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, hasRole, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!hasRole("ADMIN")) {
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

  return (
    <div className="flex min-h-screen bg-surface-soft">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-background p-5 sm:flex">
        <Link href="/admin" className="title-md mb-8 font-bold text-primary">
          bringo <span className="caption-strong uppercase text-ink">ops</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
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
      <main className="flex-1 overflow-x-hidden px-6 py-10 sm:px-10">{children}</main>
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
