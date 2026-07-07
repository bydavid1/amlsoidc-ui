import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HAPPY_PATH_STEPS,
  happyPathIndex,
  OrderStatus,
  statusLabel,
} from "./order-status";

/**
 * Stepper del flujo feliz. En estados terminales/excepción (CANCELLED,
 * DISPUTED...) no aplica: se muestra solo el aviso del estado.
 */
export function StatusStepper({
  status,
  fulfillmentStatus,
}: {
  status: OrderStatus;
  fulfillmentStatus: string | null;
}) {
  const current = happyPathIndex(status, fulfillmentStatus);

  if (current === -1) {
    return (
      <p className="body-md text-body-text">
        Este pedido está en estado{" "}
        <span className="font-semibold">{statusLabel(status)}</span>.
      </p>
    );
  }

  return (
    <ol className="grid grid-cols-4 gap-y-6 sm:grid-cols-8">
      {HAPPY_PATH_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.key} className="flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-semantic-up bg-semantic-up/10 text-semantic-up",
                active && "border-primary bg-primary text-primary-foreground",
                !done && !active && "border-hairline bg-surface-soft text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "caption max-w-20",
                active ? "font-semibold text-ink" : "text-body-text",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
