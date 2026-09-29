import { unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { DomainError, fail, ok, type ActionResult } from "@/lib/errors";
import { fieldErrorsFrom } from "@/lib/validations/common";

/** Executa a ação e converte erros em mensagens seguras para a interface. */
export async function runAction<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return ok(data, message);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof DomainError) {
      return fail(error.message, {
        code: error.code,
        fieldErrors: error.field ? { [error.field]: error.message } : undefined,
      });
    }
    if (error instanceof ZodError) {
      const fieldErrors = fieldErrorsFrom(error);
      const first = Object.values(fieldErrors)[0];
      return fail(first ?? "Confira os campos destacados.", { code: "VALIDATION", fieldErrors });
    }
    console.error("[action]", error);
    return fail("Não foi possível concluir agora. Tente novamente em instantes.", { code: "UNKNOWN" });
  }
}

/**
 * Loja, painel e PDV leem o mesmo estoque: depois de qualquer mudança de
 * catálogo, estoque, venda ou pedido, todas as rotas são revalidadas.
 */
export function revalidateAll() {
  revalidatePath("/", "layout");
}
