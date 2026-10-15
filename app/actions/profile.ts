"use server";

import { revalidatePath } from "next/cache";

import { isMocksEnabled } from "@/lib/config/mocks";
import { DomainError } from "@/lib/domain/errors";
import { mocksFormBlocked } from "@/lib/server/mocks-guard";
import { toActionError, type FormState } from "@/lib/server/action-result";
import { requireClient } from "@/lib/server/current-user";
import { getClientSessionVersion } from "@/lib/dal/accounts";
import { createClientSession } from "@/lib/server/session";
import { saveClientProfile } from "@/lib/use-cases/account/update-profile";
import { optionalCpf, optionalEmail, requiredPhone, requiredText } from "@/lib/validation/form";

export async function updateClientProfileAction(
	_prev: FormState,
	formData: FormData,
): Promise<FormState> {
	if (isMocksEnabled()) return mocksFormBlocked() ?? { ok: false, error: "" };
	const user = await requireClient();
	try {
		const accountId = await saveClientProfile(user.cpf, {
			name: requiredText(formData, "name", "o nome", 255),
			phone: requiredPhone(formData),
			email: optionalEmail(formData),
			cpf: optionalCpf(formData),
		});
		if (accountId !== user.cpf) {
			const sessionVersion = await getClientSessionVersion(accountId);
			if (sessionVersion === null) throw new DomainError("Conta não encontrada.");
			await createClientSession(accountId, sessionVersion);
		}
	} catch (error) {
		return toActionError(error, "updateClientProfileAction");
	}
	revalidatePath("/cliente", "layout");
	return { ok: true, message: "Perfil atualizado com sucesso." };
}
