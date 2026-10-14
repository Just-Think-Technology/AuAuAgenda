import "server-only";

import { insertBooking, listBusyIntervals } from "@/lib/dal/appointments";
import { getShopSettings } from "@/lib/dal/shop";
import { resolveBooking } from "@/lib/domain/availability";
import { addMinutes } from "@/lib/domain/time-zone";
import type { Tx } from "@/lib/server/db";

import { loadEligiblePair, toSchedule } from "./booking-context";

export type SlotRequest = {
	cpf: string;
	petId: string;
	serviceId: string;
	startsAt: Date;
	notes: string | null;
};

/**
 * Validates the request against current rules and inserts the booking inside `tx`.
 * Duration, end time and station are always computed here, never taken from the browser.
 */
export async function reserveSlot(tx: Tx, request: SlotRequest, now: Date) {
	const [{ service }, settings] = await Promise.all([
		loadEligiblePair(request.cpf, request.petId, request.serviceId, tx),
		getShopSettings(tx),
	]);
	const endsAtGuess = addMinutes(request.startsAt, service.durationMinutes);
	const busy = await listBusyIntervals(tx, { start: request.startsAt, end: endsAtGuess });

	const { endsAt, station } = resolveBooking({
		schedule: toSchedule(settings),
		startsAt: request.startsAt,
		durationMinutes: service.durationMinutes,
		busy,
		now,
	});

	return insertBooking(tx, {
		clientCpf: request.cpf,
		petId: request.petId,
		serviceId: service.id,
		startsAt: request.startsAt,
		endsAt,
		station,
		notes: request.notes,
	});
}
