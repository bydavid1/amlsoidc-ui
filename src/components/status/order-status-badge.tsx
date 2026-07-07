import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusLabel, statusTextClass } from "./order-status";

/** Pill gris con el color semántico SOLO en el texto (regla del design system). */
export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "rounded-full bg-surface-strong caption-strong uppercase tracking-wide",
        statusTextClass(status),
      )}
    >
      {statusLabel(status)}
    </Badge>
  );
}
