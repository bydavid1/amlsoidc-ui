"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";

/** top-nav-on-dark del design system, consciente de la sesión. */
export function MarketingNav() {
  const { status } = useAuth();

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="title-md font-bold text-primary">
            bringo
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <a href="#como-funciona" className="text-sm font-medium text-on-dark-soft hover:text-on-dark">
              Cómo funciona
            </a>
            <a href="#corredores" className="text-sm font-medium text-on-dark-soft hover:text-on-dark">
              Rutas
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {status === "authenticated" ? (
            <Button asChild className="h-10 rounded-full px-5 font-semibold">
              <Link href="/comprar">Ir a la app</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="h-10 rounded-full px-4 font-semibold text-on-dark hover:bg-on-dark/10 hover:text-on-dark"
              >
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild className="h-10 rounded-full px-5 font-semibold">
                <Link href="/registro">Crear cuenta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
