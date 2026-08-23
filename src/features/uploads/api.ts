"use client";

import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiUpload } from "@/lib/api/client";

export const uploadedFileSchema = z.object({
  storageKey: z.string(),
  mimeType: z.string(),
  sizeBytes: z.coerce.number(),
  checksumSha256: z.string(),
});
export type UploadedFile = z.infer<typeof uploadedFileSchema>;

/** Sube un archivo a POST /uploads (JPEG/PNG/WEBP) y devuelve la referencia para usar en otros módulos. */
export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return uploadedFileSchema.parse(await apiUpload("/uploads", formData));
    },
  });
}
