import { MOCK_STORAGE_KEY } from "./constants.ts";
import { createSeedDatabase } from "./seed.ts";
import type { MockDatabase } from "./types.ts";

function mergeById<T>(current: T[], incoming: T[], idOf: (item: T) => string | number): { items: T[]; added: boolean } {
	const known = new Set(current.map(idOf));
	const extras = incoming.filter((item) => !known.has(idOf(item)));
	if (extras.length === 0) return { items: current, added: false };
	return { items: [...current, ...extras], added: true };
}

/** Adds demo records that are still missing. Keeps edits already stored in the browser. */
export function mergeSeed(existing: MockDatabase, seed: MockDatabase): { store: MockDatabase; changed: boolean } {
	const clients = mergeById(existing.clients, seed.clients, (item) => item.clientId);
	const species = mergeById(existing.species, seed.species, (item) => item.speciesId);
	const breeds = mergeById(existing.breeds, seed.breeds, (item) => item.breedId);
	const pets = mergeById(existing.pets, seed.pets, (item) => item.petId);
	const services = mergeById(existing.services, seed.services, (item) => item.serviceId);
	const appointments = mergeById(existing.appointments, seed.appointments, (item) => item.appointmentId);
	const highestId = appointments.items.reduce((max, item) => Math.max(max, item.appointmentId), 0);
	const nextAppointmentId = Math.max(existing.nextAppointmentId, seed.nextAppointmentId, highestId + 1);
	const changed =
		clients.added ||
		species.added ||
		breeds.added ||
		pets.added ||
		services.added ||
		appointments.added ||
		nextAppointmentId !== existing.nextAppointmentId;

	if (!changed) return { store: existing, changed: false };
	return {
		changed: true,
		store: {
			...existing,
			nextAppointmentId,
			clients: clients.items,
			species: species.items,
			breeds: breeds.items,
			pets: pets.items,
			services: services.items,
			appointments: appointments.items,
		},
	};
}

function parseStored(raw: string): MockDatabase | null {
	try {
		const data = JSON.parse(raw) as MockDatabase;
		if (data?.version !== 2) return null;
		return data;
	} catch {
		return null;
	}
}

export function loadStore(): MockDatabase | null {
	if (typeof window === "undefined") return null;
	const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
	if (!raw) return null;
	return parseStored(raw);
}

export function saveStore(store: MockDatabase): void {
	window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
}

/** Ensures localStorage has the demo seed, including records added after the first visit. */
export function ensureSeed(): MockDatabase {
	const seed = createSeedDatabase();
	if (typeof window === "undefined") return seed;
	const existing = loadStore();
	if (!existing) {
		saveStore(seed);
		return seed;
	}
	const merged = mergeSeed(existing, seed);
	if (merged.changed) saveStore(merged.store);
	return merged.store;
}

export function replaceStore(store: MockDatabase): MockDatabase {
	saveStore(store);
	return store;
}
