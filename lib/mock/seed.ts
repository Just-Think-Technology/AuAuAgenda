import { PHONE_ACCOUNT_NAME } from "@/lib/domain/account-id";
import { addDays, addMinutes, todayKey, weekdayOf, zonedToInstant } from "@/lib/domain/time-zone";

import { DEMO_ADMIN_IDENTITY } from "./constants";
import type { MockDatabase } from "./types";

const SPECIES_DOG = "a0000001-0001-4000-8000-000000000001";
const SPECIES_CAT = "a0000001-0001-4000-8000-000000000002";
const BREED_SRDF = "e0000001-0001-4000-8000-000000000001";
const BREED_PERSA = "e0000001-0001-4000-8000-000000000002";
const SERVICE_BANHO = "c0000001-0001-4000-8000-000000000001";
const SERVICE_TOSA = "c0000001-0001-4000-8000-000000000002";
const SEED_CLIENT_CPF = "p00000000000001";
const SEED_PET_THOR = "d0000001-0001-4000-8000-000000000001";

const DEFAULT_OPENING = [
	{ weekday: 0, isClosed: true, openMinute: null, closeMinute: null },
	{ weekday: 1, isClosed: false, openMinute: 540, closeMinute: 1080 },
	{ weekday: 2, isClosed: false, openMinute: 540, closeMinute: 1080 },
	{ weekday: 3, isClosed: false, openMinute: 540, closeMinute: 1080 },
	{ weekday: 4, isClosed: false, openMinute: 540, closeMinute: 1080 },
	{ weekday: 5, isClosed: false, openMinute: 540, closeMinute: 1080 },
	{ weekday: 6, isClosed: false, openMinute: 540, closeMinute: 960 },
] as const;

function nextWeekdayAt(timeZone: string, now: Date, weekday: number, minuteOfDay: number): Date {
	let cursor = todayKey(now, timeZone);
	for (let i = 0; i < 14; i++) {
		if (weekdayOf(cursor) === weekday) {
			return zonedToInstant(cursor, minuteOfDay, timeZone);
		}
		cursor = addDays(cursor, 1);
	}
	return addMinutes(now, 60 * 24);
}

/** Prefilled demo data; appointment times anchor to the next open weekday. */
export function createSeedDatabase(now = new Date()): MockDatabase {
	const timeZone = "America/Sao_Paulo";
	const startsAt = nextWeekdayAt(timeZone, now, 2, 600);
	const endsAt = addMinutes(startsAt, 60);
	const iso = now.toISOString();

	return {
		version: 1,
		nextAppointmentId: 2,
		admin: {
			adminId: DEMO_ADMIN_IDENTITY.adminId,
			name: DEMO_ADMIN_IDENTITY.name,
			email: DEMO_ADMIN_IDENTITY.email,
			sessionVersion: DEMO_ADMIN_IDENTITY.sessionVersion,
		},
		clients: [
			{
				cpf: SEED_CLIENT_CPF,
				name: "Maria Demo",
				email: "maria.demo@example.com",
				phone: "11999998888",
				sessionVersion: 0,
				updatedAt: iso,
				deletedAt: null,
			},
		],
		species: [
			{ speciesId: SPECIES_DOG, name: "Cão" },
			{ speciesId: SPECIES_CAT, name: "Gato" },
		],
		breeds: [
			{ breedId: BREED_SRDF, name: "SRD", speciesId: SPECIES_DOG, deletedAt: null },
			{ breedId: BREED_PERSA, name: "Persa", speciesId: SPECIES_CAT, deletedAt: null },
		],
		pets: [
			{
				petId: SEED_PET_THOR,
				clientCpf: SEED_CLIENT_CPF,
				name: "Thor",
				speciesId: SPECIES_DOG,
				breedId: BREED_SRDF,
				size: "MEDIUM",
				sex: "male",
				birthDate: null,
				notes: "Gosta de tosa higiênica.",
				imageUrl: null,
				deletedAt: null,
			},
		],
		services: [
			{
				serviceId: SERVICE_BANHO,
				name: "Banho",
				description: "Banho completo com shampoo neutro.",
				durationMinutes: 60,
				priceCents: 8000,
				isActive: true,
				sizes: [],
				speciesIds: [],
				deletedAt: null,
			},
			{
				serviceId: SERVICE_TOSA,
				name: "Tosa",
				description: "Tosa na máquina ou tesoura, conforme porte.",
				durationMinutes: 90,
				priceCents: 12000,
				isActive: true,
				sizes: ["SMALL", "MEDIUM", "LARGE"],
				speciesIds: [SPECIES_DOG],
				deletedAt: null,
			},
		],
		appointments: [
			{
				appointmentId: 1,
				clientCpf: SEED_CLIENT_CPF,
				petId: SEED_PET_THOR,
				serviceId: SERVICE_BANHO,
				startsAt: startsAt.toISOString(),
				endsAt: endsAt.toISOString(),
				station: 1,
				status: "CONFIRMED",
				notes: "Cliente demo — pode alterar status na gestão.",
				statusUpdatedAt: iso,
				deletedAt: null,
			},
		],
		shopSettings: {
			name: "AuAu Agenda Demo",
			timeZone,
			capacity: 2,
			slotIntervalMinutes: 30,
			openingHours: [...DEFAULT_OPENING],
		},
	};
}

export { PHONE_ACCOUNT_NAME };
