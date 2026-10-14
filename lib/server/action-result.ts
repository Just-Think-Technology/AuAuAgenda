import "server-only";

import { DomainError } from "@/lib/domain/errors";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export type FormState = ActionResult | undefined;

export const GENERIC_ERROR = "Não foi possível concluir a operação. Tente novamente em instantes.";

/** Maps a thrown error to a message safe for the browser; unexpected errors are logged without input data. */
export function toActionError(error: unknown, context: string): { ok: false; error: string } {
	if (error instanceof DomainError) return { ok: false, error: error.message };
	console.error(`[${context}]`, error instanceof Error ? error.message : "unknown error");
	return { ok: false, error: GENERIC_ERROR };
}
