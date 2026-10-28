"use server";

import { revalidatePath } from "next/cache";

import { isMocksEnabled } from "@/lib/demo/enabled";
import { mocksFormBlocked } from "@/lib/demo/guard";
import { toActionError, type FormState } from "@/lib/server/action-result";
import { requireClient } from "@/lib/server/current-user";
import { saveClientProfile } from "@/lib/use-cases/account/update-profile";
import { requiredPhone, requiredText } from "@/lib/validation/form";

export async function updateClientProfileAction(
	_prev: FormState,
	formData: FormData,
): Promise<FormState> {
	if (isMocksEnabled()) return mocksFormBlocked() ?? { ok: false, error: "" };
	const user = await requireClient();
	try {
		await saveClientProfile(user.clientId, {
			name: requiredText(formData, "name", "o nome", 255),
			phone: requiredPhone(formData),
		});
	} catch (error) {
		return toActionError(error, "updateClientProfileAction");
	}
	revalidatePath("/cliente", "layout");
	return { ok: true, message: "Perfil atualizado com sucesso." };
}
