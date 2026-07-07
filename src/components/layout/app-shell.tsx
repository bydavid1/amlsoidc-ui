"use client";

import { Bell, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";

const SPACES = [
  { href: "/comprar", label: "Comprar" },
  { href: "/viajar", label: "Viajar" },
];

/** top-nav-light del design system: 64px, wordmark azul, switch de espacios. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-hairline bg-background">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/comprar" className="title-md font-bold text-primary">
              bringo
            </Link>
            <nav className="flex items-center gap-1">
              {SPACES.map((space) => (
                <Link
                  key={space.href}
                  href={space.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith(space.href)
                      ? "bg-surface-strong text-ink"
                      : "text-body-text hover:text-ink",
                  )}
                >
                  {space.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Notificaciones"
              onClick={() => router.push("/notificaciones")}
            >
              <Bell className="size-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full" aria-label="Cuenta">
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/cuenta")}>
                  <User className="size-4" /> Mi cuenta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="size-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
