import { DomainError } from "./errors.ts";
import {
	addDays,
	addMinutes,
	instantToDateKey,
	instantToMinuteOfDay,
	todayKey,
	weekdayOf,
	zonedToInstant,
	type DateKey,
} from "./time-zone.ts";

/** How far ahead customers may book. */
export const BOOKING_WINDOW_DAYS = 60;

export type OpeningDay = {
	weekday: number;
	isClosed: boolean;
	openMinute: number | null;
	closeMinute: number | null;
};

export type ShopSchedule = {
	timeZone: string;
	capacity: number;
	slotIntervalMinutes: number;
	openingHours: readonly OpeningDay[];
};

/** An active booking occupying `station` during `[startsAt, endsAt)`. */
export type BusyInterval = {
	station: number;
	startsAt: Date;
	endsAt: Date;
};

export type Slot = {
	startsAt: Date;
	endsAt: Date;
	minuteOfDay: number;
	freeStations: number;
};

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
	return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

function freeStations(
	capacity: number,
	busy: readonly BusyInterval[],
	startsAt: Date,
	endsAt: Date,
): number[] {
	const taken = new Set(
		busy
			.filter((interval) => overlaps(interval.startsAt, interval.endsAt, startsAt, endsAt))
			.map((interval) => interval.station),
	);
	const free: number[] = [];
	for (let station = 1; station <= capacity; station++) {
		if (!taken.has(station)) free.push(station);
	}
	return free;
}

/** Lowest station free for the whole interval, or `null` when every station is taken. */
export function pickStation(
	capacity: number,
	busy: readonly BusyInterval[],
	startsAt: Date,
	endsAt: Date,
): number | null {
	return freeStations(capacity, busy, startsAt, endsAt)[0] ?? null;
}

function openingFor(schedule: ShopSchedule, dateKey: DateKey): OpeningDay | null {
	const day = schedule.openingHours.find((d) => d.weekday === weekdayOf(dateKey));
	if (!day || day.isClosed || day.openMinute === null || day.closeMinute === null) return null;
	return day;
}

/** Whether `dateKey` is inside the bookable window starting today. */
export function isWithinBookingWindow(dateKey: DateKey, now: Date, timeZone: string): boolean {
	const today = todayKey(now, timeZone);
	return dateKey >= today && dateKey <= addDays(today, BOOKING_WINDOW_DAYS);
}

/** Start minutes on the slot grid where a service of `durationMinutes` fits before closing. */
function gridMinutes(day: OpeningDay, intervalMinutes: number, durationMinutes: number): number[] {
	const minutes: number[] = [];
	const open = day.openMinute ?? 0;
	const close = day.closeMinute ?? 0;
	for (let minute = open; minute + durationMinutes <= close; minute += intervalMinutes) {
		minutes.push(minute);
	}
	return minutes;
}

export function listAvailableSlots(input: {
	schedule: ShopSchedule;
	dateKey: DateKey;
	durationMinutes: number;
	busy: readonly BusyInterval[];
	now: Date;
}): Slot[] {
	const { schedule, dateKey, durationMinutes, busy, now } = input;
	if (!isWithinBookingWindow(dateKey, now, schedule.timeZone)) return [];
	const day = openingFor(schedule, dateKey);
	if (!day) return [];

	const slots: Slot[] = [];
	for (const minute of gridMinutes(day, schedule.slotIntervalMinutes, durationMinutes)) {
		const startsAt = zonedToInstant(dateKey, minute, schedule.timeZone);
		if (startsAt.getTime() <= now.getTime()) continue;
		const endsAt = addMinutes(startsAt, durationMinutes);
		const free = freeStations(schedule.capacity, busy, startsAt, endsAt).length;
		if (free > 0) slots.push({ startsAt, endsAt, minuteOfDay: minute, freeStations: free });
	}
	return slots;
}

/**
 * Validates a requested start against the schedule and current bookings.
 * Returns the computed end and the station to reserve.
 */
export function resolveBooking(input: {
	schedule: ShopSchedule;
	startsAt: Date;
	durationMinutes: number;
	busy: readonly BusyInterval[];
	now: Date;
}): { endsAt: Date; station: number } {
	const { schedule, startsAt, durationMinutes, busy, now } = input;
	const { timeZone } = schedule;

	if (startsAt.getTime() <= now.getTime()) {
		throw new DomainError("Escolha um horário futuro.");
	}
	const dateKey = instantToDateKey(startsAt, timeZone);
	if (!isWithinBookingWindow(dateKey, now, timeZone)) {
		throw new DomainError(`Agendamentos podem ser feitos com até ${BOOKING_WINDOW_DAYS} dias de antecedência.`);
	}

	const day = openingFor(schedule, dateKey);
	const minute = instantToMinuteOfDay(startsAt, timeZone);
	const onGrid =
		day !== null &&
		startsAt.getUTCSeconds() === 0 &&
		startsAt.getUTCMilliseconds() === 0 &&
		gridMinutes(day, schedule.slotIntervalMinutes, durationMinutes).includes(minute);
	if (!onGrid) {
		throw new DomainError("Horário fora do expediente do pet shop.");
	}

	const endsAt = addMinutes(startsAt, durationMinutes);
	const station = pickStation(schedule.capacity, busy, startsAt, endsAt);
	if (station === null) {
		throw new DomainError("Este horário acabou de ficar indisponível. Escolha outro.");
	}
	return { endsAt, station };
}
