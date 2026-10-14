"use server";

import { revalidatePath } from "next/cache";

import { DomainError } from "@/lib/domain/errors";
import { PET_SIZES } from "@/lib/domain/pet-size";
import { parseDateKey } from "@/lib/domain/time-zone";
import { toActionError, type ActionResult, type FormState } from "@/lib/server/action-result";
import { requireClient } from "@/lib/server/current-user";
import { deletePet, savePet } from "@/lib/use-cases/pets/save-pet";
import {
	isUuid,
	oneOf,
	optionalText,
	optionalUuid,
	requiredText,
	requiredUuid,
} from "@/lib/validation/form";

function optionalBirthDate(form: FormData): Date | null {
	const value = optionalText(form, "birth_date", 10);
	if (!value) return null;
	const parts = parseDateKey(value);
	const date = parts && new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
	if (!date || date.getTime() > Date.now()) throw new DomainError("Data de nascimento inválida.");
	return date;
}

function optionalSex(form: FormData): "male" | "female" | null {
	const value = form.get("sex");
	if (!value) return null;
	return oneOf(form, "sex", ["male", "female"] as const, "o sexo");
}

export async function savePetAction(_prev: FormState, formData: FormData): Promise<FormState> {
	const user = await requireClient();
	try {
		await savePet(user.cpf, optionalUuid(formData, "pet_id"), {
			name: requiredText(formData, "name", "o nome do pet", 100),
			speciesId: requiredUuid(formData, "species_id", "a espécie"),
			breedId: optionalUuid(formData, "breed_id"),
			size: oneOf(formData, "size", PET_SIZES, "o porte"),
			sex: optionalSex(formData),
			birthDate: optionalBirthDate(formData),
			notes: optionalText(formData, "notes", 500, "As observações"),
		});
	} catch (error) {
		return toActionError(error, "savePetAction");
	}
	revalidatePath("/cliente", "layout");
	return { ok: true, message: "Pet salvo." };
}

export async function deletePetAction(petId: string): Promise<ActionResult> {
	const user = await requireClient();
	if (!isUuid(petId)) return { ok: false, error: "Pet inválido." };
	try {
		await deletePet(user.cpf, petId);
	} catch (error) {
		return toActionError(error, "deletePetAction");
	}
	revalidatePath("/cliente", "layout");
	return { ok: true, message: "Pet excluído." };
}
