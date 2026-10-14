import "server-only";

import { maxFutureStation } from "@/lib/dal/appointments";
import { saveShopSettings, type ShopSettings } from "@/lib/dal/shop";
import type { OpeningDay } from "@/lib/domain/availability";
import { DomainError } from "@/lib/domain/errors";
import { isValidTimeZone } from "@/lib/domain/time-zone";
import { db } from "@/lib/server/db";

export const SLOT_INTERVALS = [10, 15, 20, 30, 60] as const;
export const CAPACITY_LIMIT = 50;

const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function assertOpeningDay(day: OpeningDay): void {
	if (day.isClosed) return;
	const { openMinute: open, closeMinute: close } = day;
	if (open === null || close === null || open < 0 || close > 1440 || open >= close) {
		throw new DomainError(`Horário de ${WEEKDAY_NAMES[day.weekday]} inválido: a abertura deve ser antes do fechamento.`);
	}
}

/**
 * Saves shop settings atomically. Capacity cannot drop below a station that
 * already holds a future booking, so no confirmed appointment loses its place.
 */
export async function updateShopSettings(input: ShopSettings): Promise<void> {
	if (!isValidTimeZone(input.timeZone)) throw new DomainError("Fuso horário inválido.");
	if (!SLOT_INTERVALS.includes(input.slotIntervalMinutes as (typeof SLOT_INTERVALS)[number])) {
		throw new DomainError("Intervalo entre horários inválido.");
	}
	if (input.openingHours.length !== 7 || new Set(input.openingHours.map((d) => d.weekday)).size !== 7) {
		throw new DomainError("Informe o expediente dos sete dias da semana.");
	}
	input.openingHours.forEach(assertOpeningDay);

	await db.$transaction(async (tx) => {
		const usedStations = await maxFutureStation(tx, new Date());
		if (input.capacity < usedStations) {
			throw new DomainError(
				`Há agendamentos futuros na estação ${usedStations}. Reduza a capacidade depois que eles forem concluídos ou cancelados.`,
			);
		}
		await saveShopSettings(tx, input);
	});
}
