"use client";

import Link from "next/link";
import { statusLabel } from "@/components/status/order-status";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminModerationSummary, useAdminOrdersSummary } from "@/features/admin/api";
import { DashboardCard, moderationCards, ordersCards } from "@/features/admin/dashboard-cards";
import { useAuth } from "@/features/auth/auth-provider";

/**
 * Home del admin: junta las tarjetas de cada dominio (cada builder vive en
 * dashboard-cards.ts) y las filtra por rol acá, en UN solo lugar genérico —
 * sumar un dominio nuevo (disputas, etc.) es agregar su builder + su query,
 * no tocar este filtro.
 */
export function Dashboard() {
  const { hasRole } = useAuth();
  const canSeeOrders = hasRole("ADMIN") || hasRole("OPS_AGENT");
  const canSeeModeration = hasRole("ADMIN") || hasRole("RIESGO_LEGAL");

  const ordersSummary = useAdminOrdersSummary(canSeeOrders);
  const moderationSummary = useAdminModerationSummary(canSeeModeration);

  const allCards: DashboardCard[] = [
    ...(ordersSummary.data ? ordersCards(ordersSummary.data) : []),
    ...(moderationSummary.data ? moderationCards(moderationSummary.data) : []),
  ];
  const visibleCards = allCards.filter(
    (card) => hasRole("ADMIN") || hasRole(card.requiredRole),
  );

  const isLoading =
    (canSeeOrders && ordersSummary.isLoading) || (canSeeModeration && moderationSummary.isLoading);

  return (
    <div className="space-y-8">
      <h1 className="display-sm text-ink">Inicio</h1>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[16px]" />
          ))}
        </div>
      ) : visibleCards.length === 0 ? (
        <p className="body-md text-body-text">Sin números disponibles para tu rol todavía.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCards.map((card) => (
            <Link key={card.id} href={card.href}>
              <Card className="h-full rounded-[16px] border-hairline bg-background shadow-none transition-colors hover:border-primary/40">
                <CardContent className="px-6 py-5">
                  <p className="number-display !text-[28px] text-ink">{card.value}</p>
                  <p className="caption text-body-text">{card.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {ordersSummary.data && ordersSummary.data.byStep.length > 0 && (
        <Card className="rounded-[16px] border-hairline bg-background shadow-none">
          <CardContent className="space-y-3 px-6 py-5">
            <h2 className="title-sm text-ink">Órdenes por paso actual</h2>
            <ul className="space-y-1.5">
              {ordersSummary.data.byStep.map((row) => (
                <li key={row.step} className="body-sm flex items-center justify-between gap-4">
                  <span className="text-body-text">{statusLabel(row.step)}</span>
                  <span className="number-display !text-[13px] text-ink">{row.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
