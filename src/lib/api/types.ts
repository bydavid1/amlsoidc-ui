/**
 * Contrato del envelope del backend (amlscs/docs/design/04-api.md §2).
 * Éxito:  { success: true, data, meta: { requestId, ...paginación } }
 * Error:  { success: false, error: { code, message, details }, meta }
 */

export interface ApiMeta {
  requestId?: string;
  // cursor
  nextCursor?: string | null;
  // offset
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
}

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorBody;
  meta: ApiMeta;
}

export interface ValidationDetail {
  field: string;
  errors: string[];
}

/**
 * Error normalizado: la UI programa contra `code` (estable), nunca contra
 * `message`. `details` trae el desglose por campo en VALIDATION_ERROR.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details: unknown[] = [],
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get validationDetails(): ValidationDetail[] {
    if (this.code !== "VALIDATION_ERROR") return [];
    return this.details as ValidationDetail[];
  }
}

/** Página por cursor tal como la entrega el cliente HTTP. */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

/** Página por offset (catálogos). */
export interface OffsetPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
