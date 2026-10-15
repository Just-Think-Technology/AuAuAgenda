"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useSyncExternalStore,
	type ReactNode,
} from "react";

import { createSeedDatabase } from "./seed";
import { ensureSeed, loadStore, saveStore } from "./storage";
import type { MockDatabase } from "./types";

type MockStoreContextValue = {
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
	clientSnapshot ??= loadStore() ?? ensureSeed();
	return clientSnapshot;
}

function getSnapshot(): MockDatabase {
	if (typeof window === "undefined") return getServerSnapshot();
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
		clientSnapshot = loadStore() ?? ensureSeed();
		notify();
	}, []);

	const value = useMemo(() => ({ store, commit, refresh }), [store, commit, refresh]);

	return <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>;
}

export function useMockStore() {
	const ctx = useContext(MockStoreContext);
	if (!ctx) throw new Error("useMockStore must be used within MockStoreProvider");
	return ctx;
}

/** Persists without React context (e.g. login before provider mount). */
export function persistMockStore(store: MockDatabase) {
	if (typeof window === "undefined") return;
	publishClientStore(store);
}
