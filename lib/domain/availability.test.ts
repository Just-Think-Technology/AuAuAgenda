import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	listAvailableSlots,
	pickStation,
	resolveBooking,
	type BusyInterval,
	type ShopSchedule,
} from "./availability.ts";
import { DomainError } from "./errors.ts";
import { zonedToInstant } from "./time-zone.ts";

const TZ = "America/Sao_Paulo";
// 2026-10-19 is a Monday.
const MONDAY = "2026-10-19";
const SUNDAY = "2026-10-18";
const NOW = new Date("2026-10-14T12:00:00Z");

function schedule(capacity = 1): ShopSchedule {
	return {
		timeZone: TZ,
		capacity,
		slotIntervalMinutes: 30,
		openingHours: [
			{ weekday: 0, isClosed: true, openMinute: null, closeMinute: null },
			{ weekday: 1, isClosed: false, openMinute: 9 * 60, closeMinute: 12 * 60 },
		],
	};
}

const at = (minute: number, key = MONDAY) => zonedToInstant(key, minute, TZ);

function busy(station: number, startMinute: number, duration: number): BusyInterval {
	return {
		station,
		startsAt: at(startMinute),
		endsAt: at(startMinute + duration),
	};
}

describe("listAvailableSlots", () => {
	it("lists grid slots where the whole service fits before closing", () => {
		const slots = listAvailableSlots({
			schedule: schedule(),
			dateKey: MONDAY,
			durationMinutes: 60,
			busy: [],
			now: NOW,
		});
		assert.deepEqual(
			slots.map((s) => s.minuteOfDay),
			[540, 570, 600, 630, 660],
		);
		assert.equal(slots[0].startsAt.toISOString(), "2026-10-19T12:00:00.000Z");
	});

	it("returns nothing on closed days and outside the booking window", () => {
		const base = { schedule: schedule(), durationMinutes: 30, busy: [], now: NOW };
		assert.equal(listAvailableSlots({ ...base, dateKey: SUNDAY }).length, 0);
		assert.equal(listAvailableSlots({ ...base, dateKey: "2027-03-01" }).length, 0);
		assert.equal(listAvailableSlots({ ...base, dateKey: "2026-10-12" }).length, 0);
	});

	it("hides slots that already started today", () => {
		const now = at(10 * 60 + 5);
		const slots = listAvailableSlots({
			schedule: schedule(),
			dateKey: MONDAY,
			durationMinutes: 30,
			busy: [],
			now,
		});
		assert.equal(slots[0].minuteOfDay, 10 * 60 + 30);
	});

	it("treats intervals as half-open so back-to-back bookings fit", () => {
		const slots = listAvailableSlots({
			schedule: schedule(),
			dateKey: MONDAY,
			durationMinutes: 60,
			busy: [busy(1, 540, 60)],
			now: NOW,
		});
		assert.deepEqual(
			slots.map((s) => s.minuteOfDay),
			[600, 630, 660],
		);
	});

	it("keeps a slot open while at least one station is free", () => {
		const slots = listAvailableSlots({
			schedule: schedule(2),
			dateKey: MONDAY,
			durationMinutes: 60,
			busy: [busy(1, 540, 60)],
			now: NOW,
		});
		assert.equal(slots[0].minuteOfDay, 540);
		assert.equal(slots[0].freeStations, 1);
	});
});

describe("pickStation", () => {
	it("returns the lowest free station and null when full", () => {
		const taken = [busy(1, 540, 60), busy(2, 570, 60)];
		assert.equal(pickStation(3, taken, at(560), at(620)), 3);
		assert.equal(pickStation(2, taken, at(560), at(620)), null);
		assert.equal(pickStation(2, taken, at(630), at(660)), 1);
	});
});

describe("resolveBooking", () => {
	const base = { schedule: schedule(), durationMinutes: 60, busy: [], now: NOW };

	it("accepts an available slot and computes end and station", () => {
		const result = resolveBooking({ ...base, startsAt: at(600) });
		assert.equal(result.station, 1);
		assert.equal(result.endsAt.toISOString(), at(660).toISOString());
	});

	it("rejects times outside opening hours or off the grid", () => {
		assert.throws(() => resolveBooking({ ...base, startsAt: at(8 * 60) }), DomainError);
		assert.throws(() => resolveBooking({ ...base, startsAt: at(11 * 60 + 30) }), DomainError);
		assert.throws(() => resolveBooking({ ...base, startsAt: at(605) }), DomainError);
		assert.throws(() => resolveBooking({ ...base, startsAt: at(600, SUNDAY) }), DomainError);
	});

	it("rejects past times", () => {
		assert.throws(
			() => resolveBooking({ ...base, startsAt: at(600), now: at(700) }),
			/horário futuro/,
		);
	});

	it("rejects overlapping bookings when capacity is exhausted", () => {
		assert.throws(
			() => resolveBooking({ ...base, startsAt: at(570), busy: [busy(1, 540, 60)] }),
			/indisponível/,
		);
	});

	it("uses another station when capacity allows", () => {
		const result = resolveBooking({
			...base,
			schedule: schedule(2),
			startsAt: at(570),
			busy: [busy(1, 540, 60)],
		});
		assert.equal(result.station, 2);
	});
});
