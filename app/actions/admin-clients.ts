"use server";

import { revalidatePath } from "next/cache";

import { isMocksEnabled } from "@/lib/demo/enabled";
import { mocksDomainBlocked, mocksFormBlocked } from "@/lib/demo/guard";
import { toActionError, type ActionResult, type FormState } from "@/lib/server/action-result";
import { requireAdmin } from "@/lib/server/current-user";
import { registerClient } from "@/lib/use-cases/account/register-client";
import { removeClient } from "@/lib/use-cases/management/clients";
import { isUuid, requiredPhone, requiredText } from "@/lib/validation/form";

export async function createClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
	if (isMocksEnabled()) return mocksFormBlocked() ?? { ok: false, error: "" };
	await requireAdmin();
	try {
		await registerClient({
			name: requiredText(formData, "name", "o nome", 255),
			phone: requiredPhone(formData),
		});
	} catch (error) {
		return toActionError(error, "createClientAction");
	}
	revalidatePath("/gestao/clientes");
	return { ok: true, message: "Cliente cadastrado." };
}

export async function deleteClientAction(clientId: string): Promise<ActionResult> {
	const blocked = mocksDomainBlocked();
	if (blocked) return blocked;
	await requireAdmin();
	if (!isUuid(clientId)) return { ok: false, error: "Cliente inválido." };
	try {
		await removeClient(clientId);
	} catch (error) {
		return toActionError(error, "deleteClientAction");
	}
	revalidatePath("/gestao", "layout");
	revalidatePath("/cliente", "layout");
	return { ok: true, message: "Cliente removido." };
}
