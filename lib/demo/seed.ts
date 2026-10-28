import type { AppointmentStatus } from "../domain/appointment-status.ts";
import type { PetSize } from "../domain/pet-size.ts";
import { addDays, addMinutes, todayKey, weekdayOf, zonedToInstant, type DateKey } from "../domain/time-zone.ts";

import data from "./data.json" with { type: "json" };
import { DEMO_ADMIN_IDENTITY } from "./constants.ts";
import type { MockAppointment, MockDatabase, MockPet } from "./types.ts";

type DemoPet = {
	key: string;
	name: string;
	speciesId: string;
	breedId: string | null;
	size: PetSize | null;
	sex: "male" | "female" | null;
	notes: string | null;
};

type DemoAppointment = {
	petKey: string;
	serviceKey: string;
	dayOffset: number;
	minuteOfDay: number;
	station: number;
	status: AppointmentStatus;
	notes: string | null;
};

type ShopPet = DemoPet & { id: string; clientKey: string };
type ShopAppointment = DemoAppointment & { id: number };

const demo = data as {
	shop: MockDatabase["shopSettings"];
	species: { id: string; name: string }[];
	breeds: { id: string; name: string; speciesId: string }[];
	services: {
		id: string;
		key: string;
		name: string;
		description: string | null;
		durationMinutes: number;
		priceCents: number | null;
		sizes: PetSize[];
		speciesIds: string[];
	}[];
	clients: { key: string; id: string; name: string; phone: string }[];
	pets: ShopPet[];
	appointments: ShopAppointment[];
	personal: { pets: DemoPet[]; appointments: DemoAppointment[] };
};

function isOpen(key: DateKey): boolean {
	const day = demo.shop.openingHours.find((item) => item.weekday === weekdayOf(key));
	return Boolean(day && !day.isClosed);
}

/** Positive offsets walk forward from today; negative offsets walk back. `0` is today when open. */
function openDay(now: Date, offset: number): DateKey {
	const timeZone = demo.shop.timeZone;
	const step = offset < 0 ? -1 : 1;
	let cursor = offset < 0 ? addDays(todayKey(now, timeZone), -1) : todayKey(now, timeZone);
	let remaining = Math.abs(offset);
	for (let i = 0; i < 28; i++) {
		if (isOpen(cursor)) {
			if (remaining === 0) return cursor;
			remaining -= 1;
		}
		cursor = addDays(cursor, step);
	}
	return cursor;
}

function serviceByKey(key: string) {
	const service = demo.services.find((item) => item.key === key);
	if (!service) throw new Error(`Serviço de demonstração desconhecido: ${key}`);
	return service;
}

function scheduled(
	now: Date,
	iso: string,
	appointment: DemoAppointment & { id: number; petId: string; clientId: string },
): MockAppointment {
	const service = serviceByKey(appointment.serviceKey);
	const startsAt = zonedToInstant(openDay(now, appointment.dayOffset), appointment.minuteOfDay, demo.shop.timeZone);
	return {
		appointmentId: appointment.id,
		clientId: appointment.clientId,
		petId: appointment.petId,
		serviceId: service.id,
		startsAt: startsAt.toISOString(),
		endsAt: addMinutes(startsAt, service.durationMinutes).toISOString(),
		station: appointment.station,
		status: appointment.status,
		notes: appointment.notes,
		statusUpdatedAt: iso,
		deletedAt: null,
	};
}

/** Shop catalog and other tutors. The signed-in account receives `personal` separately. */
export function createSeedDatabase(now = new Date()): MockDatabase {
	const iso = now.toISOString();
	const clientId = new Map(demo.clients.map((client) => [client.key, client.id]));
	const petId = new Map(demo.pets.map((pet) => [pet.key, pet.id]));

	return {
		version: 2,
		nextAppointmentId: Math.max(...demo.appointments.map((item) => item.id)) + 1,
		admin: {
			adminId: DEMO_ADMIN_IDENTITY.adminId,
			name: DEMO_ADMIN_IDENTITY.name,
			email: DEMO_ADMIN_IDENTITY.email,
			sessionVersion: DEMO_ADMIN_IDENTITY.sessionVersion,
		},
		clients: demo.clients.map((client) => ({
			clientId: client.id,
			name: client.name,
			phone: client.phone,
			sessionVersion: 0,
			updatedAt: iso,
			deletedAt: null,
		})),
		species: demo.species.map((species) => ({ speciesId: species.id, name: species.name })),
		breeds: demo.breeds.map((breed) => ({
			breedId: breed.id,
			name: breed.name,
			speciesId: breed.speciesId,
			deletedAt: null,
		})),
		pets: demo.pets.map((pet) => ({
			petId: pet.id,
			clientId: clientId.get(pet.clientKey) ?? pet.clientKey,
			name: pet.name,
			speciesId: pet.speciesId,
			breedId: pet.breedId,
			size: pet.size,
			sex: pet.sex,
			birthDate: null,
			notes: pet.notes,
			imageUrl: null,
			deletedAt: null,
		})),
		services: demo.services.map((service) => ({
			serviceId: service.id,
			name: service.name,
			description: service.description,
			durationMinutes: service.durationMinutes,
			priceCents: service.priceCents,
			isActive: true,
			sizes: service.sizes,
			speciesIds: service.speciesIds,
			deletedAt: null,
		})),
		appointments: demo.appointments.map((appointment) => {
			const pet = demo.pets.find((item) => item.key === appointment.petKey);
			if (!pet) throw new Error(`Pet de demonstração desconhecido: ${appointment.petKey}`);
			return scheduled(now, iso, {
				...appointment,
				petId: petId.get(appointment.petKey) ?? pet.id,
				clientId: clientId.get(pet.clientKey) ?? pet.clientKey,
			});
		}),
		shopSettings: {
			...demo.shop,
			openingHours: demo.shop.openingHours.map((day) => ({ ...day })),
		},
	};
}

/** Stable id so the same account does not receive the sample pet twice. */
export function personalPetId(cpf: string, key: string): string {
	const input = `${key}:${cpf}`;
	const chunks: string[] = [];
	for (let round = 1; round <= 4; round++) {
		let hash = (2166136261 ^ round) >>> 0;
		for (const char of input) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
		chunks.push(hash.toString(16).padStart(8, "0"));
	}
	const hex = chunks.join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function personalAppointmentId(cpf: string, index: number): number {
	let hash = 0;
	for (const char of cpf) hash = (Math.imul(hash, 33) + char.charCodeAt(0)) >>> 0;
	return 2_000_000 + (hash % 500_000) * 20 + index;
}

function personalPet(cpf: string, pet: DemoPet): MockPet {
	return {
		petId: personalPetId(cpf, pet.key),
		clientId: cpf,
		name: pet.name,
		speciesId: pet.speciesId,
		breedId: pet.breedId,
		size: pet.size,
		sex: pet.sex,
		birthDate: null,
		notes: pet.notes,
		imageUrl: null,
		deletedAt: null,
	};
}

/** Copies the sample pets and bookings onto a phone account that still has none. */
export function attachPersonalDemo(store: MockDatabase, cpf: string, now = new Date()): MockDatabase {
	const client = store.clients.find((item) => item.clientId === cpf && !item.deletedAt);
	if (!client) return store;
	const activePets = store.pets.filter((pet) => pet.clientId === cpf && !pet.deletedAt);
	const uniquePetIds = new Set(activePets.map((pet) => pet.petId));
	if (activePets.length > uniquePetIds.size) {
		const collided = uniquePetIds;
		store = {
			...store,
			pets: store.pets.filter((pet) => !(pet.clientId === cpf && collided.has(pet.petId))),
			appointments: store.appointments.filter(
				(appointment) => !(appointment.clientId === cpf && collided.has(appointment.petId)),
			),
		};
	} else if (activePets.length > 0) {
		return store;
	}
	if (demo.personal.pets.every((pet) => store.pets.some((row) => row.petId === personalPetId(cpf, pet.key)))) {
		return store;
	}

	const next: MockDatabase = structuredClone(store);
	const iso = now.toISOString();
	for (const pet of demo.personal.pets) next.pets.push(personalPet(cpf, pet));
	demo.personal.appointments.forEach((appointment, index) => {
		next.appointments.push(
			scheduled(now, iso, {
				...appointment,
				id: personalAppointmentId(cpf, index),
				petId: personalPetId(cpf, appointment.petKey),
				clientId: cpf,
			}),
		);
	});
	const highestId = next.appointments.reduce((max, item) => Math.max(max, item.appointmentId), 0);
	next.nextAppointmentId = Math.max(next.nextAppointmentId, highestId + 1);
	return next;
}
