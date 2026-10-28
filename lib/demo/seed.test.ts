import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { overlaps } from "../domain/availability.ts";
import { instantToDateKey, instantToMinuteOfDay, weekdayOf } from "../domain/time-zone.ts";

import { attachPersonalDemo, createSeedDatabase, personalPetId } from "./seed.ts";
import { mergeSeed } from "./storage.ts";

const now = new Date("2026-10-17T15:00:00.000Z");

function assertFits(store: ReturnType<typeof createSeedDatabase>) {
	const { timeZone, openingHours, capacity } = store.shopSettings;
	const active = store.appointments.filter(
		(appointment) => appointment.status !== "CANCELED" && appointment.status !== "NO_SHOW",
	);
	for (const appointment of active) {
		const start = new Date(appointment.startsAt);
		const end = new Date(appointment.endsAt);
		const day = instantToDateKey(start, timeZone);
		const opening = openingHours.find((item) => item.weekday === weekdayOf(day));
		assert.equal(opening?.isClosed, false);
		assert.equal(instantToDateKey(end, timeZone), day);
		assert.ok(instantToMinuteOfDay(start, timeZone) >= (opening?.openMinute ?? 0));
		assert.ok(instantToMinuteOfDay(end, timeZone) <= (opening?.closeMinute ?? 0));
		assert.ok(appointment.station >= 1 && appointment.station <= capacity);
	}
	for (let i = 0; i < active.length; i++) {
		for (let j = i + 1; j < active.length; j++) {
			const a = active[i]!;
			const b = active[j]!;
			if (a.station !== b.station) continue;
			assert.equal(
				overlaps(new Date(a.startsAt), new Date(a.endsAt), new Date(b.startsAt), new Date(b.endsAt)),
				false,
				`${a.appointmentId} overlaps ${b.appointmentId}`,
			);
		}
	}
}

describe("createSeedDatabase", () => {
	const store = createSeedDatabase(now);

	it("fills the shop from the demo JSON", () => {
		assert.ok(store.clients.length >= 4);
		assert.ok(store.pets.length >= 4);
		assert.ok(store.services.length >= 4);
		assert.ok(store.appointments.length >= 8);
		const statuses = new Set(store.appointments.map((appointment) => appointment.status));
		for (const status of ["SCHEDULED", "CONFIRMED", "IN_SERVICE", "COMPLETED", "CANCELED", "NO_SHOW"]) {
			assert.equal(statuses.has(status as never), true, status);
		}
	});

	it("keeps active bookings inside open hours and station capacity", () => {
		assertFits(store);
	});
});

describe("attachPersonalDemo", () => {
	it("gives any phone the sample pets without touching another account", () => {
		const store = createSeedDatabase(now);
		store.clients.push({
			clientId: "b0000001-0001-4000-8000-0000000000aa",
			name: "Cliente",
			phone: "11911112222",
			sessionVersion: 0,
			updatedAt: now.toISOString(),
			deletedAt: null,
		});
		const first = attachPersonalDemo(store, "b0000001-0001-4000-8000-0000000000aa", now);
		const ownPets = first.pets.filter((pet) => pet.clientId === "b0000001-0001-4000-8000-0000000000aa");
		assert.deepEqual(ownPets.map((pet) => pet.name).sort(), ["Luna", "Thor"]);
		assert.equal(new Set(ownPets.map((pet) => pet.petId)).size, 2);
		assert.notEqual(
			personalPetId("b0000001-0001-4000-8000-0000000000aa", "thor"),
			personalPetId("b0000001-0001-4000-8000-0000000000aa", "luna"),
		);
		assert.ok(first.appointments.some((appointment) => appointment.clientId === "b0000001-0001-4000-8000-0000000000aa"));
		assert.equal(attachPersonalDemo(first, "b0000001-0001-4000-8000-0000000000aa", now), first);
		assert.equal(attachPersonalDemo(first, "b0000001-0001-4000-8000-0000000000cc", now), first);
		assertFits(first);

		const withOther = structuredClone(first);
		withOther.clients.push({
			clientId: "b0000001-0001-4000-8000-0000000000bb",
			name: "Cliente",
			phone: "11933334444",
			sessionVersion: 0,
			updatedAt: now.toISOString(),
			deletedAt: null,
		});
		const second = attachPersonalDemo(withOther, "b0000001-0001-4000-8000-0000000000bb", now);
		assert.notEqual(
			personalPetId("b0000001-0001-4000-8000-0000000000aa", "thor"),
			personalPetId("b0000001-0001-4000-8000-0000000000bb", "thor"),
		);
		assert.equal(second.pets.filter((pet) => pet.name === "Thor").length, 2);

		const occupied = structuredClone(store);
		occupied.pets.push({
			petId: "d0000001-0001-4000-8000-000000000099",
			clientId: "b0000001-0001-4000-8000-0000000000aa",
			name: "Rex",
			speciesId: occupied.species[0]!.speciesId,
			breedId: null,
			size: "SMALL",
			sex: null,
			birthDate: null,
			notes: null,
			imageUrl: null,
			deletedAt: null,
		});
		assert.equal(attachPersonalDemo(occupied, "b0000001-0001-4000-8000-0000000000aa", now), occupied);
	});
});

describe("mergeSeed", () => {
	it("adds missing demo records and keeps local edits", () => {
		const seed = createSeedDatabase(now);
		const existing = structuredClone(seed);
		existing.clients = existing.clients.slice(0, 1);
		existing.clients[0]!.name = "Nome editado";
		existing.pets = existing.pets.slice(0, 1);
		existing.services = existing.services.slice(0, 2);
		existing.appointments = existing.appointments.slice(0, 1);
		existing.appointments[0]!.status = "COMPLETED";
		existing.nextAppointmentId = 2;

		const merged = mergeSeed(existing, seed);
		assert.equal(merged.changed, true);
		assert.equal(merged.store.clients[0]?.name, "Nome editado");
		assert.equal(merged.store.clients.length, seed.clients.length);
		assert.equal(merged.store.pets.length, seed.pets.length);
		assert.equal(merged.store.services.length, seed.services.length);
		assert.equal(merged.store.appointments.length, seed.appointments.length);
		assert.equal(merged.store.appointments[0]?.status, "COMPLETED");
		assert.equal(mergeSeed(merged.store, seed).changed, false);
	});
});
