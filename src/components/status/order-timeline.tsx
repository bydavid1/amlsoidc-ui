import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  BadgeCheck,
  CircleAlert,
  Clock,
  CreditCard,
  Flag,
  MapPin,
  Package,
  PackageCheck,
  PartyPopper,
  Plane,
  Search,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { statusLabel } from "./order-status";

export interface TimelineEntry {
  fromState: string | null;
  toState: string;
  actor: string | null;
  occurredAt: string;
}

type Tone = "neutral" | "progress" | "success" | "danger";

/** Icono + tono por estado (incluye el sub-flujo `fulfillment:*`). */
const STATE_VISUALS: Record<string, { icon: LucideIcon; tone: Tone }> = {
  PENDING_ASSIGNMENT: { icon: Search, tone: "neutral" },
  ASSIGNED: { icon: UserCheck, tone: "progress" },
  SOURCING: { icon: Package, tone: "progress" },
  IN_TRANSIT: { icon: Plane, tone: "progress" },
  READY_FOR_DELIVERY: { icon: MapPin, tone: "progress" },
  DELIVERED: { icon: PartyPopper, tone: "success" },
  COMPLETED: { icon: BadgeCheck, tone: "success" },
  DELIVERY_FAILED: { icon: CircleAlert, tone: "danger" },
  DISPUTED: { icon: AlertTriangle, tone: "danger" },
  CANCELLED: { icon: XCircle, tone: "danger" },
  EXPIRED: { icon: XCircle, tone: "danger" },
  // sub-flujo del Fulfillment
  AWAITING_PURCHASE: { icon: Clock, tone: "progress" },
  PURCHASED: { icon: CreditCard, tone: "progress" },
  RECEIVED_BY_TRAVELER: { icon: PackageCheck, tone: "progress" },
};

const TONE_ACTIVE: Record<Tone, string> = {
  neutral: "bg-ink text-background",
  progress: "bg-primary text-primary-foreground",
  success: "bg-semantic-up text-background",
  danger: "bg-semantic-down text-background",
};

const TONE_RING: Record<Tone, string> = {
  neutral: "ring-ink/15",
  progress: "ring-primary/20",
  success: "ring-semantic-up/20",
  danger: "ring-semantic-down/20",
};

/** 'buyer:<id>' → etiqueta humana. */
function actorLabel(actor: string | null): string | null {
  if (!actor) return null;
  if (actor.startsWith("buyer:")) return "por el comprador";
  if (actor.startsWith("traveler:")) return "por el viajero";
  if (actor.startsWith("admin:")) return "por el equipo de Bringo";
  if (actor.startsWith("system")) return "automático";
  if (actor.startsWith("user:")) return "por un participante";
  return null;
}

/**
 * Timeline del pedido estilo tracking de paquetería: el evento más reciente
 * arriba y destacado; cada paso con su icono, quién lo hizo y hace cuánto.
 * Las entradas `fulfillment:*` (sub-flujo, nivel 2) se marcan como detalle.
 */
export function OrderTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="body-sm text-muted-foreground">Sin movimientos todavía.</p>;
  }

  // más reciente primero, como un tracker de envíos
  const ordered = [...entries].reverse();

  return (
    <ol>
      {ordered.map((entry, index) => {
        const isFulfillment = entry.toState.startsWith("fulfillment:");
        const state = isFulfillment ? entry.toState.replace("fulfillment:", "") : entry.toState;
        const visual = STATE_VISUALS[state] ?? { icon: Flag, tone: "neutral" as Tone };
        const Icon = visual.icon;
        const isLatest = index === 0;
        const isLast = index === ordered.length - 1;
        const when = new Date(entry.occurredAt);
        const actor = actorLabel(entry.actor);

        return (
          <li key={`${entry.toState}-${entry.occurredAt}-${index}`} className="relative flex gap-4">
            {/* carril: icono + conector */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 flex shrink-0 items-center justify-center rounded-full",
                  isLatest
                    ? cn("size-10 ring-4", TONE_ACTIVE[visual.tone], TONE_RING[visual.tone])
                    : "size-8 border border-hairline bg-surface-soft text-body-text",
                  isFulfillment && !isLatest && "size-7",
                )}
              >
                <Icon className={isLatest ? "size-5" : "size-4"} />
              </span>
              {!isLast && <span className="w-px flex-1 bg-hairline" />}
            </div>

            {/* contenido */}
            <div className={cn("min-w-0 pb-6", isLast && "pb-0")}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p
                  className={cn(
                    isLatest ? "title-md text-ink" : "title-sm text-ink",
                    isFulfillment && !isLatest && "body-sm font-medium text-body-text",
                  )}
                >
                  {statusLabel(state)}
                </p>
                {isLatest && (
                  <span className="caption-strong uppercase tracking-wide text-primary">
                    Estado actual
                  </span>
                )}
              </div>
              <p className="caption text-muted-foreground">
                {formatDistanceToNow(when, { addSuffix: true, locale: es })}
                {actor && <> · {actor}</>}
              </p>
              <p className="caption number-display !text-[12px] text-muted-soft">
                {format(when, "d MMM yyyy, h:mm a", { locale: es })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
