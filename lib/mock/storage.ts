import { MOCK_STORAGE_KEY } from "./constants";
import { createSeedDatabase } from "./seed";
import type { MockDatabase } from "./types";

function parseStored(raw: string): MockDatabase | null {
	try {
		const data = JSON.parse(raw) as MockDatabase;
		if (data?.version !== 1) return null;
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

/** Ensures localStorage has seed data; returns the active store. */
export function ensureSeed(): MockDatabase {
	if (typeof window === "undefined") return createSeedDatabase();
	const existing = loadStore();
	if (existing) return existing;
	const seed = createSeedDatabase();
	saveStore(seed);
	return seed;
}

export function replaceStore(store: MockDatabase): MockDatabase {
	saveStore(store);
	return store;
}
