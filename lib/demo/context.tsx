"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useSyncExternalStore,
	type ReactNode,
} from "react";

import { isMocksPublic } from "./enabled-public";
import { createSeedDatabase } from "./seed";
import { ensureSeed, saveStore } from "./storage";
import type { MockDatabase } from "./types";

export type MockStoreContextValue = {
	store: MockDatabase;
	commit: (next: MockDatabase) => void;
	refresh: () => void;
};

const MockStoreContext = createContext<MockStoreContextValue | null>(null);

const listeners = new Set<() => void>();

/** Stable SSR snapshot; must keep the same reference across getServerSnapshot calls. */
let serverSnapshot: MockDatabase | null = null;

/** In-memory client snapshot; updated only on init, commit, refresh or persist. */
let clientSnapshot: MockDatabase | null = null;

function getServerSnapshot(): MockDatabase {
	serverSnapshot ??= createSeedDatabase();
	return serverSnapshot;
}

function readClientSnapshot(): MockDatabase {
	if (!isMocksPublic()) return getServerSnapshot();
	clientSnapshot ??= ensureSeed();
	return clientSnapshot;
}

function getSnapshot(): MockDatabase {
	if (!isMocksPublic() || typeof window === "undefined") return getServerSnapshot();
	return readClientSnapshot();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function notify() {
	for (const listener of listeners) listener();
}

function publishClientStore(next: MockDatabase) {
	if (!isMocksPublic()) return;
	clientSnapshot = next;
	saveStore(next);
	notify();
}

export function MockStoreProvider({ children }: { children: ReactNode }) {
	const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	const commit = useCallback((next: MockDatabase) => {
		publishClientStore(next);
	}, []);

	const refresh = useCallback(() => {
		if (!isMocksPublic()) return;
		clientSnapshot = ensureSeed();
		notify();
	}, []);

	const value = useMemo(() => ({ store, commit, refresh }), [store, commit, refresh]);

	return <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>;
}

/** Null when the demo provider is not mounted (production, MOCKS=false). */
export function useOptionalMockStore() {
	return useContext(MockStoreContext);
}

export function useMockStore() {
	const ctx = useOptionalMockStore();
	if (!ctx) throw new Error("useMockStore must be used within MockStoreProvider");
	return ctx;
}

/** Persists without React context (e.g. login before provider mount). */
export function persistMockStore(store: MockDatabase) {
	if (typeof window === "undefined") return;
	publishClientStore(store);
}
