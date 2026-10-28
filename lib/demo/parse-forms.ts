import type { OpeningDay } from "@/lib/domain/availability";
import { DomainError } from "@/lib/domain/errors";
import { PET_SIZES } from "@/lib/domain/pet-size";
import { parseTimeOfDay } from "@/lib/domain/time-zone";

import type { ServiceInput } from "./operations";

function checkbox(form: FormData, name: string): boolean {
	return form.get(name) === "on";
}

function optionalPriceCents(form: FormData, name: string): number | null {
	const raw = String(form.get(name) ?? "").trim();
	if (!raw) return null;
	const normalized = raw.replace(/\./g, "").replace(",", ".");
	const value = Number(normalized);
	if (!Number.isFinite(value) || value < 0) throw new DomainError("Preço inválido.");
	return Math.round(value * 100);
}

export function parseServiceForm(form: FormData): { serviceId: string | null; input: ServiceInput } {
	const name = String(form.get("name") ?? "").trim();
	if (!name) throw new DomainError("Informe o nome do serviço.");
	const duration = Number(form.get("duration_minutes"));
	if (!Number.isInteger(duration) || duration < 5 || duration > 720) {
		throw new DomainError("Duração inválida.");
	}
	const sizes = form
		.getAll("sizes")
		.map(String)
		.filter((s): s is (typeof PET_SIZES)[number] => PET_SIZES.includes(s as (typeof PET_SIZES)[number]));
	const speciesIds = form.getAll("species_ids").map(String).filter(Boolean);
	const serviceId = String(form.get("service_id") ?? "") || null;
	return {
		serviceId,
		input: {
			name,
			description: String(form.get("description") ?? "").trim() || null,
			durationMinutes: duration,
			priceCents: optionalPriceCents(form, "price"),
			isActive: checkbox(form, "is_active"),
			sizes,
			speciesIds,
		},
	};
}

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

export function parseShopSettingsForm(form: FormData) {
	const name = String(form.get("name") ?? "").trim();
	if (!name) throw new DomainError("Informe o nome do pet shop.");
	const timeZone = String(form.get("time_zone") ?? "").trim();
	if (!timeZone) throw new DomainError("Selecione o fuso horário.");
	const capacity = Number(form.get("capacity"));
	if (!Number.isInteger(capacity) || capacity < 1) throw new DomainError("Capacidade inválida.");
	const slotIntervalMinutes = Number(form.get("slot_interval_minutes"));
	if (!Number.isInteger(slotIntervalMinutes)) throw new DomainError("Intervalo inválido.");
	return {
		name,
		timeZone,
		capacity,
		slotIntervalMinutes,
		openingHours: readOpeningHours(form),
	};
}
