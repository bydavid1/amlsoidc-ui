"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useKycCases } from "@/features/admin/api";
import { kycStatusLabel, kycStatusToneClass } from "@/features/admin/kyc-format";
import { cn } from "@/lib/utils";

export function KycQueue() {
  const cases = useKycCases();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-sm text-ink">Revisión manual KYC</h1>
        <p className="body-sm text-body-text">
          Casos enviados, en revisión o con reintento solicitado.
        </p>
      </div>

      {cases.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[16px]" />
      ) : cases.isError ? (
        <Card className="rounded-[16px] border-hairline bg-background shadow-none">
          <CardContent className="px-5 py-8">
            <p className="body-md text-semantic-down">
              No pudimos cargar la cola de KYC. Revisa que el backend esté corriendo y vuelve a
              intentar.
            </p>
          </CardContent>
        </Card>
      ) : (cases.data ?? []).length === 0 ? (
        <Card className="rounded-[16px] border-hairline bg-background shadow-none">
          <CardContent className="px-5 py-8">
            <p className="body-md text-body-text">No hay casos pendientes de revisión.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[16px] border-hairline bg-background shadow-none">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {["Viajero", "Enviado", "Estado", ""].map((header) => (
                    <th key={header} className="caption-strong px-4 py-3 uppercase text-body-text">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.data?.map((kycCase) => (
                  <tr key={kycCase.id} className="border-b border-hairline-soft">
                    <td className="px-4 py-3">
                      <p className="body-sm font-medium text-ink">
                        {kycCase.travelerProfile.user.firstName ?? "(sin nombre)"}
                      </p>
                      <p className="caption text-body-text">{kycCase.travelerProfile.user.email}</p>
                    </td>
                    <td className="body-sm px-4 py-3 text-body-text">
                      {format(new Date(kycCase.submittedAt), "d MMM yyyy, h:mm a", { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "rounded-full bg-surface-strong caption-strong uppercase tracking-wide",
                          kycStatusToneClass(kycCase.status),
                        )}
                      >
                        {kycStatusLabel(kycCase.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/kyc/${kycCase.id}`}
                        className="inline-flex items-center gap-1 caption-strong text-primary"
                      >
                        Ver expediente <ArrowRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
