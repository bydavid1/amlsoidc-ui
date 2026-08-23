import { Role } from "@/features/auth/schemas";

/** Roles de equipo Bringo (gestionables en /admin/equipo). BUYER/TRAVELER no aplican aquí. */
export const TEAM_ROLES: Role[] = ["ADMIN", "OPS_AGENT", "SOPORTE_DISPUTAS", "RIESGO_LEGAL"];

export const TEAM_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  OPS_AGENT: "Operación",
  SOPORTE_DISPUTAS: "Soporte de disputas",
  RIESGO_LEGAL: "Riesgo / Legal",
};

export function teamRoleLabel(role: string): string {
  return TEAM_ROLE_LABELS[role] ?? role;
}
