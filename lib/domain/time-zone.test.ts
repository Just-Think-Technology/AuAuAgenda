import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	addDays,
	dayRange,
	instantToDateKey,
	instantToMinuteOfDay,
	isDateKey,
	parseTimeOfDay,
	weekdayOf,
	zonedToInstant,
} from "./time-zone.ts";

describe("time zone helpers", () => {
	it("converts local wall-clock time to the right instant", () => {
		assert.equal(
			zonedToInstant("2026-10-19", 9 * 60, "America/Sao_Paulo").toISOString(),
			"2026-10-19T12:00:00.000Z",
		);
		assert.equal(
			zonedToInstant("2026-10-19", 9 * 60, "America/Manaus").toISOString(),
			"2026-10-19T13:00:00.000Z",
		);
	});

	it("handles daylight saving transitions", () => {
		// New York switches to DST on 2026-03-08.
		assert.equal(
			zonedToInstant("2026-03-08", 12 * 60, "America/New_York").toISOString(),
			"2026-03-08T16:00:00.000Z",
		);
		assert.equal(
			zonedToInstant("2026-03-07", 12 * 60, "America/New_York").toISOString(),
			"2026-03-07T17:00:00.000Z",
		);
	});

	it("maps instants back to the local day and minute", () => {
		const lateNight = new Date("2026-10-20T02:30:00Z");
		assert.equal(instantToDateKey(lateNight, "America/Sao_Paulo"), "2026-10-19");
		assert.equal(instantToMinuteOfDay(lateNight, "America/Sao_Paulo"), 23 * 60 + 30);
	});

	it("builds half-open day ranges", () => {
		const { start, end } = dayRange("2026-10-19", "America/Sao_Paulo");
		assert.equal(start.toISOString(), "2026-10-19T03:00:00.000Z");
		assert.equal(end.toISOString(), "2026-10-20T03:00:00.000Z");
	});

	it("validates date keys and does calendar arithmetic", () => {
		assert.equal(isDateKey("2026-02-30"), false);
		assert.equal(isDateKey("2026-2-1"), false);
		assert.equal(isDateKey("2028-02-29"), true);
		assert.equal(addDays("2026-12-31", 1), "2027-01-01");
		assert.equal(weekdayOf("2026-10-18"), 0);
	});

	it("parses times of day", () => {
		assert.equal(parseTimeOfDay("09:30"), 570);
		assert.equal(parseTimeOfDay("24:00"), 1440);
		assert.equal(parseTimeOfDay("24:30"), null);
		assert.equal(parseTimeOfDay("9:30"), null);
	});
});
