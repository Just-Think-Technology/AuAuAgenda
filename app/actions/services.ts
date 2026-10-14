"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PET_SIZES } from "@/lib/domain/pet-size";
import { toActionError, type ActionResult, type FormState } from "@/lib/server/action-result";
import { requireAdmin } from "@/lib/server/current-user";
import { removeService, saveService, SERVICE_DURATION } from "@/lib/use-cases/management/services";
import {
	checkbox,
	isUuid,
	listOf,
	optionalPriceCents,
	optionalText,
	optionalUuid,
	requiredInt,
	requiredText,
	uuidList,
} from "@/lib/validation/form";

function revalidateCatalog(): void {
	revalidatePath("/gestao", "layout");
	revalidatePath("/cliente", "layout");
}

export async function saveServiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
	await requireAdmin();
	try {
		await saveService(optionalUuid(formData, "service_id"), {
			name: requiredText(formData, "name", "o nome do serviço", 120),
			description: optionalText(formData, "description", 1000, "A descrição"),
			durationMinutes: requiredInt(formData, "duration_minutes", "A duração", SERVICE_DURATION),
			priceCents: optionalPriceCents(formData, "price"),
			isActive: checkbox(formData, "is_active"),
			sizes: listOf(formData, "sizes", PET_SIZES),
			speciesIds: uuidList(formData, "species_ids"),
		});
	} catch (error) {
		return toActionError(error, "saveServiceAction");
	}
	revalidateCatalog();
	redirect("/gestao/servicos?salvo=1");
}

export async function deleteServiceAction(serviceId: string): Promise<ActionResult> {
	await requireAdmin();
	if (!isUuid(serviceId)) return { ok: false, error: "Serviço inválido." };
	try {
		await removeService(serviceId);
	} catch (error) {
		return toActionError(error, "deleteServiceAction");
	}
	revalidateCatalog();
	return { ok: true, message: "Serviço removido do catálogo." };
}
