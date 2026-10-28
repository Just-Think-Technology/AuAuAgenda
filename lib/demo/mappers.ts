import type { AppointmentStatus } from "@/lib/domain/appointment-status";
import type { BusyInterval, OpeningDay } from "@/lib/domain/availability";
import type { PetSize } from "@/lib/domain/pet-size";

import type { MockAppointment, MockDatabase, MockPet, MockService } from "./types";

export type MockServiceView = {
	id: string;
	name: string;
	description: string | null;
	durationMinutes: number;
	priceCents: number | null;
	isActive: boolean;
	sizes: PetSize[];
	speciesIds: string[];
	speciesNames: string[];
};

export type MockShopSettingsView = {
	name: string;
	timeZone: string;
	capacity: number;
	slotIntervalMinutes: number;
	openingHours: OpeningDay[];
};

export type MockAgendaEntry = MockBooking & { clientName: string; clientPhone: string | null };

export function toShopSettings(store: MockDatabase): MockShopSettingsView {
	return store.shopSettings;
}

export function toService(row: MockService, store: MockDatabase): MockServiceView {
	const speciesNames = row.speciesIds.map(
		(id) => store.species.find((s) => s.speciesId === id)?.name ?? "?",
	);
	return {
		id: row.serviceId,
		name: row.name,
		description: row.description,
		durationMinutes: row.durationMinutes,
		priceCents: row.priceCents,
		isActive: row.isActive,
		sizes: row.sizes,
		speciesIds: row.speciesIds,
		speciesNames,
	};
}

export function activeServices(store: MockDatabase, activeOnly: boolean): MockServiceView[] {
	return store.services
		.filter((s) => !s.deletedAt && (!activeOnly || s.isActive))
		.map((s) => toService(s, store));
}

function petRow(pet: MockPet, store: MockDatabase) {
	const species = store.species.find((s) => s.speciesId === pet.speciesId);
	const breed = pet.breedId ? store.breeds.find((b) => b.breedId === pet.breedId) : null;
	return {
		pet_id: pet.petId,
		name: pet.name,
		size: pet.size,
		sex: pet.sex,
		birth_date: pet.birthDate ? new Date(pet.birthDate) : null,
		notes: pet.notes,
		image_url: pet.imageUrl,
		species_id: pet.speciesId,
		breed_id: pet.breedId,
		species: species ? { name: species.name } : null,
		breed: breed ? { name: breed.name } : null,
	};
}

export function listPetsByOwner(store: MockDatabase, cpf: string) {
	return store.pets.filter((p) => p.clientId === cpf && !p.deletedAt).map((p) => petRow(p, store));
}

export type MockBooking = {
	id: number;
	startsAt: Date;
	endsAt: Date;
	status: AppointmentStatus;
	station: number;
	notes: string | null;
	serviceId: string;
	serviceName: string;
	petId: string;
	petName: string;
	petSize: MockPet["size"];
	petNotes: string | null;
	speciesName: string | null;
	breedName: string | null;
};

function toBooking(row: MockAppointment, store: MockDatabase): MockBooking | null {
	if (row.deletedAt || !row.serviceId) return null;
	const service = store.services.find((s) => s.serviceId === row.serviceId);
	const pet = store.pets.find((p) => p.petId === row.petId);
	const species = pet ? store.species.find((s) => s.speciesId === pet.speciesId) : null;
	const breed = pet?.breedId ? store.breeds.find((b) => b.breedId === pet.breedId) : null;
	return {
		id: row.appointmentId,
		startsAt: new Date(row.startsAt),
		endsAt: new Date(row.endsAt),
		status: row.status,
		station: row.station,
		notes: row.notes,
		serviceId: row.serviceId,
		serviceName: service?.name ?? "Serviço removido",
		petId: row.petId,
		petName: pet?.name ?? "Pet removido",
		petSize: pet?.size ?? null,
		petNotes: pet?.notes ?? null,
		speciesName: species?.name ?? null,
		breedName: breed?.name ?? null,
	};
}

export function findClientBooking(store: MockDatabase, id: number, cpf: string): MockBooking | null {
	const row = store.appointments.find(
		(a) => a.appointmentId === id && a.clientId === cpf && !a.deletedAt,
	);
	return row ? toBooking(row, store) : null;
}

export function findServiceById(store: MockDatabase, serviceId: string): MockServiceView | null {
	const row = store.services.find((s) => s.serviceId === serviceId && !s.deletedAt);
	return row ? toService(row, store) : null;
}

export function listClientBookings(store: MockDatabase, cpf: string): MockBooking[] {
	return store.appointments
		.filter((a) => a.clientId === cpf && !a.deletedAt)
		.map((a) => toBooking(a, store))
		.filter((b): b is MockBooking => b !== null)
		.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
}

export function listBusyIntervals(
	store: MockDatabase,
	range: { start: Date; end: Date },
	excludeId?: number,
): BusyInterval[] {
	return store.appointments
		.filter(
			(a) =>
				!a.deletedAt &&
				a.status !== "CANCELED" &&
				a.appointmentId !== excludeId &&
				new Date(a.startsAt) < range.end &&
				new Date(a.endsAt) > range.start,
		)
		.map((a) => ({
			station: a.station,
			startsAt: new Date(a.startsAt),
			endsAt: new Date(a.endsAt),
		}));
}

export function listDayAgenda(
	store: MockDatabase,
	filter: {
		start: Date;
		end: Date;
		status: AppointmentStatus | null;
		serviceId: string | null;
	},
): MockAgendaEntry[] {
	return store.appointments
		.filter((a) => {
			if (a.deletedAt) return false;
			const start = new Date(a.startsAt);
			if (start < filter.start || start >= filter.end) return false;
			if (filter.status && a.status !== filter.status) return false;
			if (filter.serviceId && a.serviceId !== filter.serviceId) return false;
			return true;
		})
		.sort(
			(a, b) =>
				new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
				a.station - b.station,
		)
		.map((a) => {
			const booking = toBooking(a, store)!;
			const client = store.clients.find((c) => c.clientId === a.clientId);
			return {
				...booking,
				clientName: client?.name ?? "—",
				clientPhone: client?.phone ?? null,
			};
		});
}

export function listClientsWithPets(store: MockDatabase) {
	return store.clients
		.filter((c) => !c.deletedAt)
		.map((client) => ({
			client_id: client.clientId,
			name: client.name,
			phone: client.phone,
			pet: store.pets
				.filter((p) => p.clientId === client.clientId && !p.deletedAt)
				.map((p) => {
					const species = store.species.find((s) => s.speciesId === p.speciesId);
					const breed = p.breedId ? store.breeds.find((b) => b.breedId === p.breedId) : null;
					return {
						pet_id: p.petId,
						name: p.name,
						size: p.size,
						sex: p.sex,
						birth_date: p.birthDate ? new Date(p.birthDate) : null,
						notes: p.notes,
						image_url: p.imageUrl,
						species: species ? { name: species.name } : null,
						breed: breed ? { name: breed.name } : null,
					};
				}),
		}));
}
