/**
 * Calendar math in an explicit IANA time zone using only `Intl`.
 * A `DateKey` is a local calendar day in the shop time zone, formatted `YYYY-MM-DD`.
 */
export type DateKey = string;

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MINUTE_MS = 60_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
	let formatter = formatters.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", {
			timeZone,
			hourCycle: "h23",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		formatters.set(timeZone, formatter);
	}
	return formatter;
}

type LocalParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
};

function localParts(instant: Date, timeZone: string): LocalParts {
	const parts = formatterFor(timeZone).formatToParts(instant);
	const read = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((part) => part.type === type)?.value ?? 0);
	return {
		year: read("year"),
		month: read("month"),
		day: read("day"),
		hour: read("hour"),
		minute: read("minute"),
		second: read("second"),
	};
}

function offsetMs(instantMs: number, timeZone: string): number {
	const p = localParts(new Date(instantMs), timeZone);
	const localAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
	return localAsUtc - Math.floor(instantMs / 1000) * 1000;
}

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

export function isValidTimeZone(timeZone: string): boolean {
	try {
		formatterFor(timeZone);
		return true;
	} catch {
		return false;
	}
}

export function parseDateKey(key: DateKey): { year: number; month: number; day: number } | null {
	const match = DATE_KEY_PATTERN.exec(key);
	if (!match) return null;
	const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const check = new Date(Date.UTC(year, month - 1, day));
	if (
		check.getUTCFullYear() !== year ||
		check.getUTCMonth() !== month - 1 ||
		check.getUTCDate() !== day
	) {
		return null;
	}
	return { year, month, day };
}

export function isDateKey(value: string): boolean {
	return parseDateKey(value) !== null;
}

function requireDateKey(key: DateKey) {
	const parsed = parseDateKey(key);
	if (!parsed) throw new RangeError(`Invalid date key: ${key}`);
	return parsed;
}

export function addDays(key: DateKey, days: number): DateKey {
	const { year, month, day } = requireDateKey(key);
	const date = new Date(Date.UTC(year, month - 1, day + days));
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: DateKey): number {
	const { year, month, day } = requireDateKey(key);
	return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Instant of `minuteOfDay` minutes after local midnight of `key` in `timeZone`. */
export function zonedToInstant(key: DateKey, minuteOfDay: number, timeZone: string): Date {
	const { year, month, day } = requireDateKey(key);
	const wallClockAsUtc = Date.UTC(year, month - 1, day, 0, minuteOfDay);
	let instant = wallClockAsUtc - offsetMs(wallClockAsUtc, timeZone);
	const correctedOffset = offsetMs(instant, timeZone);
	if (wallClockAsUtc - instant !== correctedOffset) {
		instant = wallClockAsUtc - correctedOffset;
	}
	return new Date(instant);
}

export function instantToDateKey(instant: Date, timeZone: string): DateKey {
	const p = localParts(instant, timeZone);
	return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function instantToMinuteOfDay(instant: Date, timeZone: string): number {
	const p = localParts(instant, timeZone);
	return p.hour * 60 + p.minute;
}

export function todayKey(now: Date, timeZone: string): DateKey {
	return instantToDateKey(now, timeZone);
}

/** Half-open `[start, end)` instants covering the local day. */
export function dayRange(key: DateKey, timeZone: string): { start: Date; end: Date } {
	return {
		start: zonedToInstant(key, 0, timeZone),
		end: zonedToInstant(addDays(key, 1), 0, timeZone),
	};
}

export function addMinutes(instant: Date, minutes: number): Date {
	return new Date(instant.getTime() + minutes * MINUTE_MS);
}

export function formatMinuteOfDay(minuteOfDay: number): string {
	return `${pad(Math.floor(minuteOfDay / 60))}:${pad(minuteOfDay % 60)}`;
}

/** Parses `HH:MM` into minutes since midnight; accepts `24:00` as end of day. */
export function parseTimeOfDay(value: string): number | null {
	const match = /^(\d{2}):(\d{2})$/.exec(value);
	if (!match) return null;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (minutes > 59 || hours > 24 || (hours === 24 && minutes !== 0)) return null;
	return hours * 60 + minutes;
}
