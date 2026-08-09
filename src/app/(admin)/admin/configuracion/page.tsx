"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveFlowSetting, useSetActiveFlowSetting } from "@/features/admin/api";

const FLOW_LABEL: Record<
  "TRAVELER_PURCHASES_PRODUCT" | "CUSTOMER_SHIPS_TO_TRAVELER" | "BUYER_SHIPS_TO_TRAVELER",
  string
> = {
  TRAVELER_PURCHASES_PRODUCT: "Flujo A — El viajero compra",
  CUSTOMER_SHIPS_TO_TRAVELER: "Flujo B — Bringo compra y el viajero entrega directo",
  BUYER_SHIPS_TO_TRAVELER: "Flujo C — Bringo compra, pasa por hub y Bringo entrega",
};

export default function AdminConfigurationPage() {
  const setting = useActiveFlowSetting();
  const setFlow = useSetActiveFlowSetting();

  const initialFlow = setting.data?.activeFlowType;
  const [pendingFlow, setPendingFlow] = useState<typeof initialFlow>();
  const [reason, setReason] = useState("");

  const selectedFlow = pendingFlow ?? initialFlow;

  const changed = useMemo(() => {
    return Boolean(initialFlow && selectedFlow && initialFlow !== selectedFlow);
  }, [initialFlow, selectedFlow]);

  if (setting.isLoading) {
    return <Skeleton className="h-56 w-full rounded-[16px]" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-sm text-ink">Configuración</h1>
        <p className="body-md text-body-text">
          El flujo seleccionado aplica solo a órdenes nuevas. Las órdenes ya creadas conservan su flujo.
        </p>
      </div>

      <Card className="rounded-[16px] border-hairline bg-background shadow-none">
        <CardHeader>
          <CardTitle className="title-md text-ink">Flujo activo de fulfillment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="caption-strong uppercase text-body-text">Flujo actual</p>
            <p className="body-md text-ink">
              {initialFlow ? FLOW_LABEL[initialFlow] : "No configurado"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="caption-strong uppercase text-body-text">Nuevo flujo</p>
            <Select
              value={selectedFlow}
              onValueChange={(value) =>
                setPendingFlow(
                  value as
                    | "TRAVELER_PURCHASES_PRODUCT"
                    | "CUSTOMER_SHIPS_TO_TRAVELER"
                    | "BUYER_SHIPS_TO_TRAVELER",
                )
              }
            >
              <SelectTrigger className="h-11 rounded-full bg-background">
                <SelectValue placeholder="Selecciona un flujo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FLOW_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="caption-strong uppercase text-body-text">Motivo (opcional)</p>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ejemplo: activar piloto de flujo B en operación"
              className="h-11 rounded-full bg-background"
            />
          </div>

          <Button
            className="h-11 rounded-full px-6"
            disabled={!changed || setFlow.isPending || !selectedFlow}
            onClick={() => {
              if (!selectedFlow) return;
              setFlow.mutate(
                { activeFlowType: selectedFlow, reason: reason.trim() || undefined },
                {
                  onSuccess: () => {
                    setReason("");
                  },
                },
              );
            }}
          >
            Guardar flujo activo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
