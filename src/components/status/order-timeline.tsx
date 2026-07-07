import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { statusLabel } from "./order-status";

export interface TimelineEntry {
  fromState: string | null;
  toState: string;
  actor: string | null;
  occurredAt: string;
}

/**
 * Timeline del pedido tal como lo persiste el backend (OrderStatusHistory).
 * Las entradas `fulfillment:*` son el sub-flujo (nivel 2) y se muestran
 * indentadas como sub-pasos.
 */
export function OrderTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="body-sm text-muted-foreground">Sin movimientos todavía.</p>;
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry, index) => {
        const isFulfillment = entry.toState.startsWith("fulfillment:");
        const state = isFulfillment ? entry.toState.replace("fulfillment:", "") : entry.toState;
        const isLast = index === entries.length - 1;
        return (
          <li
            key={`${entry.toState}-${entry.occurredAt}-${index}`}
            className={cn("relative flex gap-4 pb-6", isFulfillment && "pl-6", isLast && "pb-0")}
          >
            {/* conector vertical */}
            {!isLast && (
              <span
                className={cn(
                  "absolute top-3 h-full w-px bg-hairline",
                  isFulfillment ? "left-[31px]" : "left-[7px]",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-1.5 size-4 shrink-0 rounded-full border-2",
                isLast
                  ? "border-primary bg-primary"
                  : "border-hairline bg-background",
              )}
            />
            <div className="space-y-0.5">
              <p className={cn("title-sm text-ink", isFulfillment && "body-sm font-medium")}>
                {statusLabel(state)}
                {isFulfillment && (
                  <span className="caption text-muted-foreground"> · detalle del encargo</span>
                )}
              </p>
              <p className="caption text-muted-foreground number-display !text-[13px]">
                {format(new Date(entry.occurredAt), "d 'de' MMMM yyyy, h:mm a", { locale: es })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
