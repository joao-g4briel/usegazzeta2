// Erros de regra de negócio: a mensagem é segura para mostrar ao usuário.
export class DomainError extends Error {
  readonly code: string;
  readonly field?: string;

  constructor(message: string, code = "DOMAIN_ERROR", field?: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.field = field;
  }
}

export class InsufficientStockError extends DomainError {
  readonly variantId: string;
  readonly available: number;

  constructor(label: string, variantId: string, available: number) {
    super(
      available <= 0
        ? `Estoque insuficiente: ${label} está esgotado.`
        : `Estoque insuficiente: ${label} tem apenas ${available} ${available === 1 ? "unidade" : "unidades"}.`,
      "INSUFFICIENT_STOCK",
    );
    this.variantId = variantId;
    this.available = available;
  }
}

export class DuplicateBarcodeError extends DomainError {
  constructor() {
    super(
      "Este código de barras já pertence a outro produto.",
      "DUPLICATE_BARCODE",
      "barcode",
    );
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | {
      ok: false;
      error: string;
      code?: string;
      fieldErrors?: Record<string, string>;
    };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(
  error: string,
  extra?: { code?: string; fieldErrors?: Record<string, string> },
): ActionResult<never> {
  return { ok: false, error, ...extra };
}
