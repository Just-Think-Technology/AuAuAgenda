import "server-only";

import { listClientBookings, type Booking } from "@/lib/dal/appointments";
import { getShopSettings } from "@/lib/dal/shop";
import type { AppointmentStatus } from "@/lib/domain/appointment-status";

const OPEN: readonly AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_SERVICE"];

/** Splits the client's bookings into upcoming (soonest first) and history (latest first). */
export async function getClientBookings(cpf: string, now: Date) {
	const [bookings, settings] = await Promise.all([listClientBookings(cpf), getShopSettings()]);
	const isUpcoming = (b: Booking) => OPEN.includes(b.status) && b.endsAt > now;

	return {
		timeZone: settings.timeZone,
		upcoming: bookings
			.filter(isUpcoming)
			.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
		history: bookings.filter((b) => !isUpcoming(b)),
	};
}
