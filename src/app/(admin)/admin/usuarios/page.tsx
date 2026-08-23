"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { IdentityDocumentType, useAdminUsers } from "@/features/admin/api";
import { DOCUMENT_TYPE_OPTIONS } from "@/features/admin/kyc-format";

interface DocumentSearch {
  countryIso2: string;
  type: IdentityDocumentType | "";
  number: string;
}

const EMPTY_DOCUMENT: DocumentSearch = { countryIso2: "", type: "", number: "" };

function isCompleteDocument(
  doc: DocumentSearch,
): doc is { countryIso2: string; type: IdentityDocumentType; number: string } {
  return doc.countryIso2.trim().length === 2 && doc.type !== "" && doc.number.trim().length >= 3;
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [document, setDocument] = useState<DocumentSearch>(EMPTY_DOCUMENT);

  const documentParams = useMemo(
    () => (isCompleteDocument(document) ? document : undefined),
    [document],
  );
  const users = useAdminUsers(documentParams ? "" : q, documentParams);

  return (
    <div className="space-y-6">
      <h1 className="display-sm text-ink">Usuarios</h1>

      <Card className="rounded-[16px] border-hairline bg-background shadow-none">
        <CardContent className="space-y-4 px-5 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nombre o teléfono"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setDocument(EMPTY_DOCUMENT);
              }}
              disabled={Boolean(documentParams)}
              className="h-12 rounded-full bg-background pl-11"
            />
          </div>

          <div className="space-y-2">
            <p className="caption-strong uppercase text-body-text">
              O buscar por documento (coincidencia exacta)
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="doc-country" className="caption text-body-text">
                  País (ISO-2)
                </Label>
                <Input
                  id="doc-country"
                  value={document.countryIso2}
                  onChange={(e) =>
                    setDocument((prev) => ({
                      ...prev,
                      countryIso2: e.target.value.toUpperCase().slice(0, 2),
                    }))
                  }
                  placeholder="SV"
                  maxLength={2}
                  className="h-10 w-24 rounded-full uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-type" className="caption text-body-text">
                  Tipo
                </Label>
                <Select
                  value={document.type}
                  onValueChange={(value) =>
                    setDocument((prev) => ({ ...prev, type: value as IdentityDocumentType }))
                  }
                >
                  <SelectTrigger id="doc-type" className="h-10 w-[220px] rounded-full">
                    <SelectValue placeholder="Tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-number" className="caption text-body-text">
                  Número
                </Label>
                <Input
                  id="doc-number"
                  value={document.number}
                  onChange={(e) => setDocument((prev) => ({ ...prev, number: e.target.value }))}
                  placeholder="Número de documento"
                  className="h-10 w-[220px] rounded-full"
                />
              </div>
              {(document.countryIso2 || document.type || document.number) && (
                <Button
                  variant="ghost"
                  className="h-10 rounded-full px-4 text-body-text"
                  onClick={() => setDocument(EMPTY_DOCUMENT)}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {users.isLoading ? (
        <Skeleton className="h-48 w-full rounded-[16px]" />
      ) : (
        <div className="space-y-2">
          {users.data?.map((u) => (
            <Card key={u.id} className="rounded-[16px] border-hairline bg-background shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="title-sm truncate text-ink">
                    {u.firstName ?? "(sin nombre)"}{" "}
                    <span className="body-sm font-normal text-body-text">{u.email}</span>
                  </p>
                  <p className="caption text-body-text">
                    {u.phone && (
                      <span className="number-display !text-[12px]">{u.phone} · </span>
                    )}
                    {u.roles.length > 0 ? u.roles.join(", ") : "sin roles"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      u.status === "ACTIVE"
                        ? "rounded-full bg-surface-strong caption-strong text-semantic-up"
                        : "rounded-full bg-surface-strong caption-strong text-semantic-down"
                    }
                  >
                    {u.status === "ACTIVE" ? "Activo" : "Suspendido"}
                  </Badge>
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="inline-flex items-center gap-1 caption-strong text-primary"
                  >
                    Ver perfil <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {users.data?.length === 0 && (
            <p className="body-md text-body-text">Sin resultados.</p>
          )}
        </div>
      )}
    </div>
  );
}
