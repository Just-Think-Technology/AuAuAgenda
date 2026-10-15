"use server";

import { revalidatePath } from "next/cache";

import { isMocksEnabled } from "@/lib/config/mocks";
import { isPhoneAccountId } from "@/lib/domain/account-id";
import { mocksDomainBlocked, mocksFormBlocked } from "@/lib/server/mocks-guard";
import { isValidCpf, normalizeCpf } from "@/lib/domain/cpf";
import { toActionError, type ActionResult, type FormState } from "@/lib/server/action-result";
import { requireAdmin } from "@/lib/server/current-user";
import { registerClient } from "@/lib/use-cases/account/register-client";
import { removeClient } from "@/lib/use-cases/management/clients";
import { newPassword, requiredEmail, requiredPhone, requiredText } from "@/lib/validation/form";

export async function createClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
	if (isMocksEnabled()) return mocksFormBlocked() ?? { ok: false, error: "" };
	await requireAdmin();
	try {
		await registerClient(
			{
				name: requiredText(formData, "name", "o nome", 255),
				cpf: requiredText(formData, "cpf", "o CPF", 14),
				email: requiredEmail(formData),
				phone: requiredPhone(formData),
				password: newPassword(formData),
				birthDate: null,
			},
			{ requireBirthDate: false },
		);
	} catch (error) {
		return toActionError(error, "createClientAction");
	}
	revalidatePath("/gestao/clientes");
	return { ok: true, message: "Cliente cadastrado." };
}

export async function deleteClientAction(cpf: string): Promise<ActionResult> {
	const blocked = mocksDomainBlocked();
	if (blocked) return blocked;
	await requireAdmin();
	const accountId = isPhoneAccountId(cpf) ? cpf : normalizeCpf(cpf);
	if (!isPhoneAccountId(accountId) && !isValidCpf(accountId)) {
		return { ok: false, error: "Cliente inválido." };
	}
	try {
		await removeClient(accountId);
	} catch (error) {
		return toActionError(error, "deleteClientAction");
	}
	revalidatePath("/gestao", "layout");
	revalidatePath("/cliente", "layout");
	return { ok: true, message: "Cliente removido." };
}
