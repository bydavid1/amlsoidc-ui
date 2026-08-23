"use client";

import { Check, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UploadedFile, useUploadFile } from "@/features/uploads/api";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadField({
  label,
  hint,
  capture,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  capture?: "user" | "environment";
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFile();

  return (
    <div className="space-y-2">
      <p className="body-sm font-semibold text-ink">{label}</p>
      <p className="caption text-body-text">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture={capture}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!ALLOWED_MIME_TYPES.has(file.type)) {
            toast.error("Solo se aceptan fotos JPEG, PNG o WEBP.");
            return;
          }
          upload.mutate(file, {
            onSuccess: (uploaded) => onChange(uploaded),
            onError: () => toast.error("No pudimos subir la foto. Intentá de nuevo."),
          });
        }}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface-soft p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-semantic-up/10 text-semantic-up">
            <Check className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="body-sm truncate font-medium text-ink">Foto lista</p>
            <p className="caption text-muted-foreground">
              {value.mimeType} · {formatBytes(value.sizeBytes)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => inputRef.current?.click()}
          >
            Cambiar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="h-12 rounded-full px-6 font-semibold"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" /> {upload.isPending ? "Subiendo…" : "Subir foto"}
        </Button>
      )}
    </div>
  );
}
