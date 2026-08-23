"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Ban, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  IdentityDocumentType,
  useBlocklist,
  useBlockDocument,
  useUnblockDocument,
} from "@/features/admin/api";
import { DOCUMENT_TYPE_OPTIONS, documentTypeLabel, shortId } from "@/features/admin/kyc-format";

interface DocumentForm {
  countryIso2: string;
  type: IdentityDocumentType | "";
  number: string;
}

const EMPTY_DOCUMENT: DocumentForm = { countryIso2: "", type: "", number: "" };

function isCompleteDocument(
  doc: DocumentForm,
): doc is { countryIso2: string; type: IdentityDocumentType; number: string } {
  return (
    doc.countryIso2.trim().length === 2 && doc.type !== "" && doc.number.trim().length >= 3
  );
}

function BlockDocumentDialog() {
  const [open, setOpen] = useState(false);
  const [document, setDocument] = useState<DocumentForm>(EMPTY_DOCUMENT);
  const [reason, setReason] = useState("");
  const block = useBlockDocument();

  const trimmedReason = reason.trim();
  const disabled =
    block.isPending || !isCompleteDocument(document) || trimmedReason.length < 5 ||
    trimmedReason.length > 500;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setDocument(EMPTY_DOCUMENT);
          setReason("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full px-5 font-semibold">
          <Ban className="size-4" /> Bloquear documento
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="title-lg text-ink">Bloquear documento</DialogTitle>
          <DialogDescription className="body-md text-body-text">
            El documento no podrá usarse para enviar KYC ni reclamar pedidos mientras esté
            bloqueado. El motivo es obligatorio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="block-country">País (ISO-2)</Label>
              <Input
                id="block-country"
                value={document.countryIso2}
                onChange={(event) =>
                  setDocument((prev) => ({
                    ...prev,
                    countryIso2: event.target.value.toUpperCase().slice(0, 2),
                  }))
                }
                placeholder="SV"
                maxLength={2}
                className="h-11 rounded-full uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-type">Tipo</Label>
              <Select
                value={document.type}
                onValueChange={(value) =>
                  setDocument((prev) => ({ ...prev, type: value as IdentityDocumentType }))
                }
              >
                <SelectTrigger id="block-type" className="h-11 w-full rounded-full">
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="block-number">Número de documento</Label>
            <Input
              id="block-number"
              value={document.number}
              onChange={(event) =>
                setDocument((prev) => ({ ...prev, number: event.target.value }))
              }
              placeholder="Número tal como aparece en el documento"
              className="h-11 rounded-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="block-reason">Motivo</Label>
            <Textarea
              id="block-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo del bloqueo…"
              className="min-h-24 rounded-2xl"
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            className="h-11 rounded-full px-5 font-semibold"
            disabled={disabled}
            onClick={() => {
              if (!isCompleteDocument(document)) return;
              block.mutate(
                { document, reason: trimmedReason },
                {
                  onSuccess: () => {
                    setOpen(false);
                    setDocument(EMPTY_DOCUMENT);
                    setReason("");
                  },
                },
              );
            }}
          >
            {block.isPending ? "Bloqueando…" : "Confirmar bloqueo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BlocklistManager() {
  const [search, setSearch] = useState<DocumentForm>(EMPTY_DOCUMENT);
  const unblock = useUnblockDocument();

  const searchParams = useMemo(
    () => (isCompleteDocument(search) ? search : {}),
    [search],
  );
  const blocklist = useBlocklist(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display-sm text-ink">Blocklist de documentos</h1>
          <p className="body-sm text-body-text">
            Documentos de identidad con acceso bloqueado a KYC y asignaciones.
          </p>
        </div>
        <BlockDocumentDialog />
      </div>

      <Card className="rounded-[16px] border-hairline bg-background shadow-none">
        <CardContent className="space-y-3 px-5 py-4">
          <p className="caption-strong uppercase text-body-text">Buscar documento exacto</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="search-country" className="caption text-body-text">
                País (ISO-2)
              </Label>
              <Input
                id="search-country"
                value={search.countryIso2}
                onChange={(event) =>
                  setSearch((prev) => ({
                    ...prev,
                    countryIso2: event.target.value.toUpperCase().slice(0, 2),
                  }))
                }
                placeholder="SV"
                maxLength={2}
                className="h-10 w-24 rounded-full uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-type" className="caption text-body-text">
                Tipo
              </Label>
              <Select
                value={search.type}
                onValueChange={(value) =>
                  setSearch((prev) => ({ ...prev, type: value as IdentityDocumentType }))
                }
              >
                <SelectTrigger id="search-type" className="h-10 w-[220px] rounded-full">
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
              <Label htmlFor="search-number" className="caption text-body-text">
                Número
              </Label>
              <Input
                id="search-number"
                value={search.number}
                onChange={(event) =>
                  setSearch((prev) => ({ ...prev, number: event.target.value }))
                }
                placeholder="Número de documento"
                className="h-10 w-[220px] rounded-full"
              />
            </div>
            <Button
              variant="secondary"
              className="h-10 rounded-full px-4"
              disabled={!isCompleteDocument(search)}
              onClick={() => setSearch({ ...search })}
            >
              <Search className="size-4" /> Buscar
            </Button>
            {(search.countryIso2 || search.type || search.number) && (
              <Button
                variant="ghost"
                className="h-10 rounded-full px-4 text-body-text"
                onClick={() => setSearch(EMPTY_DOCUMENT)}
              >
                Limpiar
              </Button>
            )}
          </div>
          <p className="caption text-muted-foreground">
            Completa país, tipo y número para buscar un documento exacto. Sin búsqueda se muestra
            el listado completo de bloqueados.
          </p>
        </CardContent>
      </Card>

      {blocklist.isLoading ? (
        <Skeleton className="h-48 w-full rounded-[16px]" />
      ) : (blocklist.data ?? []).length === 0 ? (
        <Card className="rounded-[16px] border-hairline bg-background shadow-none">
          <CardContent className="px-5 py-8">
            <p className="body-md text-body-text">No hay documentos bloqueados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {blocklist.data?.map((entry) => (
            <Card key={entry.id} className="rounded-[16px] border-hairline bg-background shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="body-sm font-medium text-ink">
                    {entry.documentCountryIso2} · {documentTypeLabel(entry.documentType)}
                  </p>
                  <p className="body-sm text-body-text">“{entry.reason}”</p>
                  <p className="caption text-muted-foreground">
                    Bloqueado por {shortId(entry.blockedByUserId)} el{" "}
                    {format(new Date(entry.blockedAt), "d MMM yyyy, h:mm a", { locale: es })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full font-semibold text-semantic-up"
                  disabled={unblock.isPending}
                  onClick={() => {
                    if (window.confirm("¿Desbloquear este documento?")) {
                      unblock.mutate(entry.id);
                    }
                  }}
                >
                  Desbloquear
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
