import "server-only";

import { listBusyIntervals } from "@/lib/dal/appointments";
import { getShopSettings } from "@/lib/dal/shop";
import { listAvailableSlots, type Slot } from "@/lib/domain/availability";
import { dayRange, type DateKey } from "@/lib/domain/time-zone";
import { db } from "@/lib/server/db";

import { toSchedule } from "./booking-context";

/** Slots for a service duration on a local day; `excludeId` ignores the booking being rescheduled. */
export async function getAvailableSlots(input: {
	dateKey: DateKey;
	durationMinutes: number;
	excludeId?: number;
}): Promise<{ slots: Slot[]; timeZone: string }> {
	const settings = await getShopSettings();
	const busy = await listBusyIntervals(db, dayRange(input.dateKey, settings.timeZone), input.excludeId);
	return {
		timeZone: settings.timeZone,
		slots: listAvailableSlots({
			schedule: toSchedule(settings),
			dateKey: input.dateKey,
			durationMinutes: input.durationMinutes,
			busy,
			now: new Date(),
		}),
	};
}
