"use server";

import { revalidatePath } from "next/cache";

import type { OpeningDay } from "@/lib/domain/availability";
import { DomainError } from "@/lib/domain/errors";
import { parseTimeOfDay } from "@/lib/domain/time-zone";
import { toActionError, type FormState } from "@/lib/server/action-result";
import { requireAdmin } from "@/lib/server/current-user";
import { CAPACITY_LIMIT, updateShopSettings } from "@/lib/use-cases/management/shop-settings";
import { checkbox, requiredInt, requiredText } from "@/lib/validation/form";

function readTime(form: FormData, key: string): number {
	const value = form.get(key);
	const minute = typeof value === "string" ? parseTimeOfDay(value) : null;
	if (minute === null) throw new DomainError("Horário de expediente inválido.");
	return minute;
}

function readOpeningHours(form: FormData): OpeningDay[] {
	return Array.from({ length: 7 }, (_, weekday) => {
		const isClosed = !checkbox(form, `open_${weekday}`);
		return {
			weekday,
			isClosed,
			openMinute: isClosed ? null : readTime(form, `start_${weekday}`),
			closeMinute: isClosed ? null : readTime(form, `end_${weekday}`),
		};
	});
}

export async function saveShopSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
	await requireAdmin();
	try {
		await updateShopSettings({
			name: requiredText(formData, "name", "o nome do pet shop", 120),
			timeZone: requiredText(formData, "time_zone", "o fuso horário", 64),
			capacity: requiredInt(formData, "capacity", "A quantidade de estações", { min: 1, max: CAPACITY_LIMIT }),
			slotIntervalMinutes: requiredInt(formData, "slot_interval_minutes", "O intervalo", { min: 10, max: 60 }),
			openingHours: readOpeningHours(formData),
		});
	} catch (error) {
		return toActionError(error, "saveShopSettingsAction");
	}
	revalidatePath("/gestao", "layout");
	revalidatePath("/cliente", "layout");
	return { ok: true, message: "Configurações salvas." };
}
