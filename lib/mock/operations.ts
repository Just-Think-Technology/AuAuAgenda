import { PHONE_ACCOUNT_NAME } from "@/lib/domain/account-id";
import {
	assertCustomerCanChange,
	type AppointmentStatus,
} from "@/lib/domain/appointment-status";
import {
	listAvailableSlots,
	resolveBooking,
	type ShopSchedule,
} from "@/lib/domain/availability";
import { DomainError } from "@/lib/domain/errors";
import { normalizePhone } from "@/lib/domain/phone";
import type { PetSize } from "@/lib/domain/pet-size";
import { eligibilityProblem } from "@/lib/domain/service-eligibility";
import { addMinutes, dayRange, type DateKey } from "@/lib/domain/time-zone";

import { newPhoneAccountId, newUuid } from "./ids";
import { listBusyIntervals, listClientBookings, toService } from "./mappers";
import type { MockDatabase, MockPet, MockService } from "./types";

function clone(store: MockDatabase): MockDatabase {
	return structuredClone(store);
}

function activeClientByPhone(store: MockDatabase, phone: string) {
	return store.clients.find((c) => c.phone === phone && !c.deletedAt);
}

export function continueWithPhone(store: MockDatabase, rawPhone: string): {
	store: MockDatabase;
	cpf: string;
	name: string;
	sessionVersion: number;
} {
	const phone = normalizePhone(rawPhone);
	if (!phone) throw new DomainError("Telefone inválido.");
	const next = clone(store);
	const existing = activeClientByPhone(next, phone);
	if (existing) {
		return {
			store: next,
			cpf: existing.cpf,
			name: existing.name,
			sessionVersion: existing.sessionVersion,
		};
	}
	const cpf = newPhoneAccountId();
	const now = new Date().toISOString();
	next.clients.push({
		cpf,
		name: PHONE_ACCOUNT_NAME,
		email: null,
		phone,
		sessionVersion: 0,
		updatedAt: now,
		deletedAt: null,
	});
	return { store: next, cpf, name: PHONE_ACCOUNT_NAME, sessionVersion: 0 };
}

export function toSchedule(settings: MockDatabase["shopSettings"]): ShopSchedule {
	return {
		timeZone: settings.timeZone,
		capacity: settings.capacity,
		slotIntervalMinutes: settings.slotIntervalMinutes,
		openingHours: settings.openingHours,
	};
}

export function getAvailableSlots(
	store: MockDatabase,
	input: { dateKey: DateKey; durationMinutes: number; excludeId?: number },
) {
	const settings = store.shopSettings;
	const busy = listBusyIntervals(store, dayRange(input.dateKey, settings.timeZone), input.excludeId);
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

function loadEligiblePair(store: MockDatabase, cpf: string, petId: string, serviceId: string) {
	const pet = store.pets.find((p) => p.petId === petId && p.clientCpf === cpf && !p.deletedAt);
	const serviceRow = store.services.find((s) => s.serviceId === serviceId && !s.deletedAt);
	if (!pet) throw new DomainError("Pet não encontrado.");
	if (!serviceRow) throw new DomainError("Serviço não encontrado.");
	const service = toService(serviceRow, store);
	const problem = eligibilityProblem(
		{ isActive: service.isActive, sizes: service.sizes, speciesIds: service.speciesIds },
		{ size: pet.size, speciesId: pet.speciesId },
	);
	if (problem) throw new DomainError(problem);
	return { pet, service, serviceRow };
}

function reserveSlot(
	store: MockDatabase,
	request: {
		cpf: string;
		petId: string;
		serviceId: string;
		startsAt: Date;
		notes: string | null;
	},
	now: Date,
) {
	const { service } = loadEligiblePair(store, request.cpf, request.petId, request.serviceId);
	const settings = store.shopSettings;
	const endsAtGuess = addMinutes(request.startsAt, service.durationMinutes);
	const busy = listBusyIntervals(store, { start: request.startsAt, end: endsAtGuess });
	const { endsAt, station } = resolveBooking({
		schedule: toSchedule(settings),
		startsAt: request.startsAt,
		durationMinutes: service.durationMinutes,
		busy,
		now,
	});
	const iso = now.toISOString();
	const id = store.nextAppointmentId;
	store.nextAppointmentId += 1;
	store.appointments.push({
		appointmentId: id,
		clientCpf: request.cpf,
		petId: request.petId,
		serviceId: request.serviceId,
		startsAt: request.startsAt.toISOString(),
		endsAt: endsAt.toISOString(),
		station,
		status: "SCHEDULED",
		notes: request.notes,
		statusUpdatedAt: iso,
		deletedAt: null,
	});
	return id;
}

export function createBooking(
	store: MockDatabase,
	request: {
		cpf: string;
		petId: string;
		serviceId: string;
		startsAt: Date;
		notes: string | null;
	},
): { store: MockDatabase; id: number } {
	const next = clone(store);
	const id = reserveSlot(next, request, new Date());
	return { store: next, id };
}

export function cancelBooking(store: MockDatabase, cpf: string, appointmentId: number): MockDatabase {
	const next = clone(store);
	const row = next.appointments.find((a) => a.appointmentId === appointmentId && a.clientCpf === cpf);
	if (!row || row.deletedAt) throw new DomainError("Agendamento não encontrado.");
	assertCustomerCanChange(row.status, new Date(row.startsAt), new Date());
	row.status = "CANCELED";
	row.statusUpdatedAt = new Date().toISOString();
	return next;
}

export function rescheduleBooking(
	store: MockDatabase,
	cpf: string,
	appointmentId: number,
	startsAt: Date,
	notes: string | null,
): { store: MockDatabase; id: number } {
	const next = clone(store);
	const now = new Date();
	const row = next.appointments.find((a) => a.appointmentId === appointmentId && a.clientCpf === cpf);
	if (!row || row.deletedAt) throw new DomainError("Agendamento não encontrado.");
	assertCustomerCanChange(row.status, new Date(row.startsAt), now);
	row.status = "CANCELED";
	row.statusUpdatedAt = now.toISOString();
	const id = reserveSlot(
		next,
		{
			cpf,
			petId: row.petId,
			serviceId: row.serviceId,
			startsAt,
			notes: notes ?? row.notes,
		},
		now,
	);
	return { store: next, id };
}

export function changeBookingStatus(
	store: MockDatabase,
	appointmentId: number,
	from: AppointmentStatus,
	to: AppointmentStatus,
): MockDatabase {
	const next = clone(store);
	const row = next.appointments.find((a) => a.appointmentId === appointmentId && !a.deletedAt);
	if (!row || row.status !== from) throw new DomainError("O agendamento foi alterado enquanto você editava. Atualize a página.");
	row.status = to;
	row.statusUpdatedAt = new Date().toISOString();
	return next;
}

export type PetInput = {
	name: string;
	speciesId: string;
	breedId: string | null;
	size: PetSize;
	sex: "male" | "female" | null;
	birthDate: Date | null;
	notes: string | null;
};

function hasUpcomingBooking(store: MockDatabase, owner: { petId: string } | { clientCpf: string }, now: Date) {
	const open: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_SERVICE"];
	return store.appointments.some((a) => {
		if (a.deletedAt || !open.includes(a.status)) return false;
		if (new Date(a.endsAt) <= now) return false;
		if ("petId" in owner) return a.petId === owner.petId;
		return a.clientCpf === owner.clientCpf;
	});
}

export function savePet(
	store: MockDatabase,
	cpf: string,
	petId: string | null,
	input: PetInput,
): MockDatabase {
	const next = clone(store);
	if (!next.species.some((s) => s.speciesId === input.speciesId)) {
		throw new DomainError("Espécie inválida.");
	}
	if (input.breedId) {
		const breed = next.breeds.find((b) => b.breedId === input.breedId && !b.deletedAt);
		if (!breed || breed.speciesId !== input.speciesId) throw new DomainError("Raça inválida.");
	}
	if (petId) {
		const pet = next.pets.find((p) => p.petId === petId && p.clientCpf === cpf && !p.deletedAt);
		if (!pet) throw new DomainError("Pet não encontrado.");
		Object.assign(pet, {
			name: input.name,
			speciesId: input.speciesId,
			breedId: input.breedId,
			size: input.size,
			sex: input.sex,
			birthDate: input.birthDate?.toISOString() ?? null,
			notes: input.notes,
		} satisfies Partial<MockPet>);
	} else {
		next.pets.push({
			petId: newUuid(),
			clientCpf: cpf,
			name: input.name,
			speciesId: input.speciesId,
			breedId: input.breedId,
			size: input.size,
			sex: input.sex,
			birthDate: input.birthDate?.toISOString() ?? null,
			notes: input.notes,
			imageUrl: null,
			deletedAt: null,
		});
	}
	return next;
}

export function deletePet(store: MockDatabase, cpf: string, petId: string): MockDatabase {
	const next = clone(store);
	const now = new Date();
	if (hasUpcomingBooking(next, { petId }, now)) {
		throw new DomainError("Este pet tem agendamentos futuros. Cancele ou remarque antes de excluir.");
	}
	const pet = next.pets.find((p) => p.petId === petId && p.clientCpf === cpf && !p.deletedAt);
	if (!pet) throw new DomainError("Pet não encontrado.");
	pet.deletedAt = now.toISOString();
	return next;
}

export function updateClientProfile(
	store: MockDatabase,
	cpf: string,
	input: { name: string; email: string | null; phone: string; cpfDocument: string | null },
): { store: MockDatabase; sessionVersion: number } {
	const next = clone(store);
	const client = next.clients.find((c) => c.cpf === cpf && !c.deletedAt);
	if (!client) throw new DomainError("Conta não encontrada.");
	const phone = normalizePhone(input.phone);
	if (!phone) throw new DomainError("Telefone inválido.");
	const phoneTaken = next.clients.find(
		(c) => c.phone === phone && !c.deletedAt && c.cpf !== cpf,
	);
	if (phoneTaken) throw new DomainError("Este telefone já está em uso.");
	client.name = input.name.trim();
	client.email = input.email?.trim() || null;
	client.phone = phone;
	client.updatedAt = new Date().toISOString();
	client.sessionVersion += 1;
	return { store: next, sessionVersion: client.sessionVersion };
}

export type ServiceInput = {
	name: string;
	description: string | null;
	durationMinutes: number;
	priceCents: number | null;
	isActive: boolean;
	sizes: PetSize[];
	speciesIds: string[];
};

export function saveService(store: MockDatabase, serviceId: string | null, input: ServiceInput): {
	store: MockDatabase;
	serviceId: string;
} {
	if (input.durationMinutes % 5 !== 0) {
		throw new DomainError("A duração deve ser múltipla de 5 minutos.");
	}
	const speciesIds = [...new Set(input.speciesIds)];
	if (speciesIds.some((id) => !store.species.some((s) => s.speciesId === id))) {
		throw new DomainError("Espécie inválida.");
	}
	const next = clone(store);
	const normalized: ServiceInput = { ...input, speciesIds, sizes: [...new Set(input.sizes)] };
	if (!serviceId) {
		const id = newUuid();
		next.services.push({
			serviceId: id,
			name: normalized.name,
			description: normalized.description,
			durationMinutes: normalized.durationMinutes,
			priceCents: normalized.priceCents,
			isActive: normalized.isActive,
			sizes: normalized.sizes,
			speciesIds: normalized.speciesIds,
			deletedAt: null,
		});
		return { store: next, serviceId: id };
	}
	const row = next.services.find((s) => s.serviceId === serviceId && !s.deletedAt);
	if (!row) throw new DomainError("Serviço não encontrado.");
	Object.assign(row, {
		name: normalized.name,
		description: normalized.description,
		durationMinutes: normalized.durationMinutes,
		priceCents: normalized.priceCents,
		isActive: normalized.isActive,
		sizes: normalized.sizes,
		speciesIds: normalized.speciesIds,
	} satisfies Partial<MockService>);
	return { store: next, serviceId };
}

export function removeService(store: MockDatabase, serviceId: string): MockDatabase {
	const next = clone(store);
	const row = next.services.find((s) => s.serviceId === serviceId && !s.deletedAt);
	if (!row) throw new DomainError("Serviço não encontrado.");
	row.deletedAt = new Date().toISOString();
	row.isActive = false;
	return next;
}

export function saveShopSettings(
	store: MockDatabase,
	input: MockDatabase["shopSettings"],
): MockDatabase {
	const next = clone(store);
	const now = new Date();
	const maxStation = next.appointments
		.filter(
			(a) =>
				!a.deletedAt &&
				["SCHEDULED", "CONFIRMED", "IN_SERVICE"].includes(a.status) &&
				new Date(a.endsAt) > now,
		)
		.reduce((max, a) => Math.max(max, a.station), 0);
	if (input.capacity < maxStation) {
		throw new DomainError(
			`Há agendamentos futuros usando ${maxStation} estações. A capacidade não pode ser menor que isso.`,
		);
	}
	next.shopSettings = input;
	return next;
}

export function createClientAccount(
	store: MockDatabase,
	input: { name: string; cpf: string; email: string; phone: string },
): MockDatabase {
	const next = clone(store);
	const phone = normalizePhone(input.phone);
	if (!phone) throw new DomainError("Telefone inválido.");
	if (activeClientByPhone(next, phone)) throw new DomainError("Este telefone já está em uso.");
	if (next.clients.some((c) => c.cpf === input.cpf && !c.deletedAt)) {
		throw new DomainError("CPF já cadastrado.");
	}
	const now = new Date().toISOString();
	next.clients.push({
		cpf: input.cpf,
		name: input.name.trim(),
		email: input.email.trim(),
		phone,
		sessionVersion: 0,
		updatedAt: now,
		deletedAt: null,
	});
	return next;
}

export function softDeleteClient(store: MockDatabase, cpf: string): MockDatabase {
	const next = clone(store);
	const client = next.clients.find((c) => c.cpf === cpf && !c.deletedAt);
	if (!client) throw new DomainError("Cliente não encontrado.");
	const now = new Date().toISOString();
	client.deletedAt = now;
	client.updatedAt = now;
	client.sessionVersion += 1;
	const petIds = new Set(next.pets.filter((pet) => pet.clientCpf === cpf).map((pet) => pet.petId));
	for (const pet of next.pets) {
		if (pet.clientCpf === cpf && !pet.deletedAt) pet.deletedAt = now;
	}
	for (const appointment of next.appointments) {
		if (appointment.deletedAt) continue;
		if (appointment.clientCpf === cpf || petIds.has(appointment.petId)) {
			appointment.deletedAt = now;
		}
	}
	return next;
}

export function splitClientBookings(store: MockDatabase, cpf: string, now: Date) {
	const bookings = listClientBookings(store, cpf);
	const open: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_SERVICE"];
	const isUpcoming = (b: (typeof bookings)[number]) => open.includes(b.status) && b.endsAt > now;
	return {
		timeZone: store.shopSettings.timeZone,
		upcoming: bookings.filter(isUpcoming).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
		history: bookings.filter((b) => !isUpcoming(b)),
	};
}
