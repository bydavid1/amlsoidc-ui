"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/status/order-status-badge";
import { statusLabel } from "@/components/status/order-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminOrder,
  useAdminOrders,
  useConfirmHubReception,
  useDispatchToBuyer,
  useRegisterProcurement,
  useRegisterTracking,
} from "@/features/admin/api";

function flowLabel(flowType: string): string {
  if (flowType === "TRAVELER_PURCHASES_PRODUCT") return "A";
  if (flowType === "BRINGO_PURCHASES_DIRECT_DELIVERY") return "B";
  if (flowType === "BRINGO_PURCHASES_HUB_DELIVERY") return "C";
  return flowType;
}

function travelerLabel(order: AdminOrder): string {
  if (order.travelerName) return order.travelerName;
  if (order.travelerEmail) return order.travelerEmail;
  return "Sin viajero asignado";
}

function isFlowBOrC(order: AdminOrder): boolean {
  return (
    order.flowType === "BRINGO_PURCHASES_DIRECT_DELIVERY" ||
    order.flowType === "BRINGO_PURCHASES_HUB_DELIVERY"
  );
}

type OperatorActionKind =
  | "REGISTER_PROCUREMENT"
  | "REGISTER_TRACKING"
  | "CONFIRM_HUB_RECEPTION"
  | "DISPATCH_TO_BUYER"
  | null;

function actionFor(order: AdminOrder): OperatorActionKind {
  if (
    isFlowBOrC(order) &&
    (order.status === "ASSIGNED" || order.status === "SOURCING") &&
    order.fulfillmentStatus === "AWAITING_PURCHASE"
  ) {
    return "REGISTER_PROCUREMENT";
  }

  if (
    isFlowBOrC(order) &&
    (order.status === "ASSIGNED" || order.status === "SOURCING") &&
    order.fulfillmentStatus === "PURCHASED"
  ) {
    return "REGISTER_TRACKING";
  }

  if (
    order.flowType === "BRINGO_PURCHASES_HUB_DELIVERY" &&
    order.status === "IN_TRANSIT" &&
    order.fulfillmentStatus === "RECEIVED_BY_TRAVELER"
  ) {
    return "CONFIRM_HUB_RECEPTION";
  }

  if (
    order.flowType === "BRINGO_PURCHASES_HUB_DELIVERY" &&
    order.status === "READY_FOR_DELIVERY" &&
    order.fulfillmentStatus === "HUB_RECEIVED_BY_BRINGO"
  ) {
    return "DISPATCH_TO_BUYER";
  }

  return null;
}

function actionLabel(action: OperatorActionKind): string {
  if (action === "REGISTER_PROCUREMENT") return "Registrar compra";
  if (action === "REGISTER_TRACKING") return "Registrar tracking";
  if (action === "CONFIRM_HUB_RECEPTION") return "Confirmar recepción en hub";
  if (action === "DISPATCH_TO_BUYER") return "Marcar despacho";
  return "Sin acción";
}

function TrackingDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const registerTracking = useRegisterTracking();

  const disabled = registerTracking.isPending || trackingNumber.trim().length < 3;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-full px-4 text-xs">Registrar tracking</Button>
      </DialogTrigger>
      <DialogContent className="rounded-[20px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar tracking</DialogTitle>
          <DialogDescription>
            Ingresa el número de guía para continuar el flujo de la orden.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const value = trackingNumber.trim();
            if (value.length < 3) return;
            registerTracking.mutate(
              { orderId, trackingNumber: value },
              {
                onSuccess: () => {
                  setTrackingNumber("");
                  setOpen(false);
                },
              },
            );
          }}
        >
          <Input
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="Número de guía"
            className="h-11 rounded-full"
          />
          <Button type="submit" className="h-11 w-full rounded-full" disabled={disabled}>
            {registerTracking.isPending ? "Registrando…" : "Confirmar tracking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActionCell({ order }: { order: AdminOrder }) {
  const registerProcurement = useRegisterProcurement();
  const confirmHubReception = useConfirmHubReception();
  const dispatchToBuyer = useDispatchToBuyer();
  const action = actionFor(order);

  if (!action) {
    return <span className="caption text-body-text">—</span>;
  }

  if (action === "REGISTER_PROCUREMENT") {
    return (
      <Button
        className="h-9 rounded-full px-4 text-xs"
        disabled={registerProcurement.isPending}
        onClick={() => registerProcurement.mutate(order.id)}
      >
        {registerProcurement.isPending ? "Guardando…" : "Registrar compra"}
      </Button>
    );
  }

  if (action === "REGISTER_TRACKING") {
    return <TrackingDialog orderId={order.id} />;
  }

  if (action === "CONFIRM_HUB_RECEPTION") {
    return (
      <Button
        className="h-9 rounded-full px-4 text-xs"
        disabled={confirmHubReception.isPending}
        onClick={() => confirmHubReception.mutate({ orderId: order.id })}
      >
        {confirmHubReception.isPending ? "Guardando…" : "Confirmar recepción"}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      className="h-9 rounded-full px-4 text-xs"
      disabled={dispatchToBuyer.isPending}
      onClick={() => dispatchToBuyer.mutate(order.id)}
    >
      {dispatchToBuyer.isPending ? "Guardando…" : "Marcar despacho"}
    </Button>
  );
}

function OperationRow({ order }: { order: AdminOrder }) {
  const action = actionFor(order);

  return (
    <tr className="border-b border-hairline-soft">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="body-sm font-medium text-ink">{order.productName}</span>
          <Link
            href={`/admin/operacion/${order.id}`}
            className="inline-flex items-center gap-1 caption-strong text-primary"
          >
            Ver detalle <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </td>
      <td className="body-sm px-4 py-3 text-body-text">{order.buyerEmail}</td>
      <td className="body-sm px-4 py-3 text-body-text">{travelerLabel(order)}</td>
      <td className="body-sm px-4 py-3 text-body-text">{flowLabel(order.flowType)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.fulfillmentStatus ?? order.status} />
          <span className="caption text-body-text">{statusLabel(order.flowStep)}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <ActionCell order={order} />
          {action && <p className="caption text-muted-foreground">{actionLabel(action)}</p>}
        </div>
      </td>
    </tr>
  );
}

export default function AdminOperationsPage() {
  const orders = useAdminOrders();
  const rows = useMemo(() => orders.data ?? [], [orders.data]);

  const [flowFilter, setFlowFilter] = useState<"ALL" | "A" | "B" | "C">("ALL");
  const [stepFilter, setStepFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState<"ALL" | "PENDING" | "NONE">("ALL");

  const stepOptions = useMemo(() => {
    const values = new Set<string>();
    for (const order of rows) {
      values.add(order.flowStep);
    }
    return Array.from(values).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((order) => {
      const flow = flowLabel(order.flowType);
      const action = actionFor(order);

      if (flowFilter !== "ALL" && flow !== flowFilter) return false;
      if (stepFilter !== "ALL" && order.flowStep !== stepFilter) return false;
      if (actionFilter === "PENDING" && !action) return false;
      if (actionFilter === "NONE" && action) return false;
      return true;
    });
  }, [rows, flowFilter, stepFilter, actionFilter]);

  return (
    <div className="space-y-6">
      <h1 className="display-sm text-ink">Operación</h1>

      <Card className="rounded-[16px] border-hairline bg-background shadow-none">
        <CardContent className="flex flex-wrap items-center gap-3 px-5 py-4">
          <Select value={flowFilter} onValueChange={(value) => setFlowFilter(value as typeof flowFilter)}>
            <SelectTrigger className="h-10 w-[220px] rounded-full">
              <SelectValue placeholder="Filtrar por flujo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los flujos</SelectItem>
              <SelectItem value="A">Flujo A</SelectItem>
              <SelectItem value="B">Flujo B</SelectItem>
              <SelectItem value="C">Flujo C</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stepFilter} onValueChange={setStepFilter}>
            <SelectTrigger className="h-10 w-[280px] rounded-full">
              <SelectValue placeholder="Filtrar por estado/paso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los pasos</SelectItem>
              {stepOptions.map((step) => (
                <SelectItem key={step} value={step}>
                  {statusLabel(step)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={actionFilter}
            onValueChange={(value) => setActionFilter(value as typeof actionFilter)}
          >
            <SelectTrigger className="h-10 w-[300px] rounded-full">
              <SelectValue placeholder="Filtrar por acción pendiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Con y sin acción pendiente</SelectItem>
              <SelectItem value="PENDING">Solo con acción pendiente</SelectItem>
              <SelectItem value="NONE">Solo sin acción pendiente</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {orders.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[16px]" />
      ) : orders.isError ? (
        <Card className="rounded-[16px] border-hairline bg-background shadow-none">
          <CardContent className="px-5 py-8">
            <p className="body-md text-semantic-down">
              No pudimos cargar las órdenes. Revisa que el backend esté corriendo, que tu sesión
              tenga rol admin y vuelve a intentar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[16px] border-hairline bg-background shadow-none">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[1060px] text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {[
                    "Producto",
                    "Comprador",
                    "Viajero",
                    "Flujo",
                    "Estado/paso actual",
                    "Acción disponible",
                  ].map((header) => (
                    <th key={header} className="caption-strong px-4 py-3 uppercase text-body-text">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((order) => (
                  <OperationRow key={order.id} order={order} />
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="body-md px-4 py-8 text-center text-body-text">
                      No hay órdenes con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
