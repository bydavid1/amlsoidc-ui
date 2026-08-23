import { AdminModerationSummary, AdminOrdersSummary } from "@/features/admin/api";
import { Role } from "@/features/auth/schemas";

/**
 * Una tarjeta = dato + a quién le toca verla. Agregar una tarjeta nueva es
 * sumar un objeto a la lista que arma cada builder de abajo, no tocar un
 * `if (role === ...)` en el componente que renderiza — así cuando los roles
 * dejen de ser fijos en código, solo cambia de dónde sale `requiredRole`.
 */
export interface DashboardCard {
  id: string;
  label: string;
  value: number;
  href: string;
  requiredRole: Role;
}

const FLOW_LABELS: Record<string, string> = {
  TRAVELER_PURCHASES_PRODUCT: "Flujo A",
  BRINGO_PURCHASES_DIRECT_DELIVERY: "Flujo B",
  BRINGO_PURCHASES_HUB_DELIVERY: "Flujo C",
};

export function ordersCards(summary: AdminOrdersSummary): DashboardCard[] {
  const flowCards: DashboardCard[] = summary.byFlow.map((f) => ({
    id: `orders-flow-${f.flowType}`,
    label: `${FLOW_LABELS[f.flowType] ?? f.flowType} — órdenes`,
    value: f.count,
    href: "/admin/operacion",
    requiredRole: "OPS_AGENT",
  }));

  return [
    ...flowCards,
    {
      id: "orders-pending-action",
      label: "Con acción pendiente",
      value: summary.pendingActionCount,
      href: "/admin/operacion",
      requiredRole: "OPS_AGENT",
    },
  ];
}

export function moderationCards(summary: AdminModerationSummary): DashboardCard[] {
  return [
    {
      id: "kyc-pending",
      label: "Casos pendientes de KYC",
      value: summary.kycPendingCount,
      href: "/admin/kyc",
      requiredRole: "RIESGO_LEGAL",
    },
    {
      id: "blocklist-count",
      label: "Documentos bloqueados",
      value: summary.blockedDocumentsCount,
      href: "/admin/blocklist",
      requiredRole: "RIESGO_LEGAL",
    },
    {
      id: "travelers-limit-override",
      label: "Viajeros con límite ajustado",
      value: summary.travelersWithLimitOverrideCount,
      href: "/admin/usuarios",
      requiredRole: "RIESGO_LEGAL",
    },
    {
      id: "users-suspended",
      label: "Usuarios suspendidos",
      value: summary.suspendedUsersCount,
      href: "/admin/usuarios",
      requiredRole: "RIESGO_LEGAL",
    },
  ];
}
