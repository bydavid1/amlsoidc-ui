"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-provider";

/**
 * Guard de las rutas (app): mientras se rehidrata la sesión muestra skeleton;
 * sin sesión redirige a /login preservando el destino.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== "authenticated") {
    return (
      <div className="mx-auto w-full max-w-[1200px] space-y-6 px-6 py-12">
        <Skeleton className="h-10 w-64 rounded-full" />
        <Skeleton className="h-40 w-full rounded-[24px]" />
        <Skeleton className="h-40 w-full rounded-[24px]" />
      </div>
    );
  }
  return <>{children}</>;
}
