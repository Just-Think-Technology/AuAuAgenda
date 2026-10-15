import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { isMocksEnabled } from "@/lib/config/mocks";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createClient(): PrismaClient {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is not configured.");
	}
	return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function requireDb(): PrismaClient {
	if (isMocksEnabled()) {
		throw new Error("Database access is disabled when MOCKS=true.");
	}
	const client = globalForPrisma.prisma ?? createClient();
	if (process.env.NODE_ENV !== "production") {
		globalForPrisma.prisma = client;
	}
	return client;
}

/** One client per process; unavailable when MOCKS=true. */
export const db = new Proxy({} as PrismaClient, {
	get(_target, prop, receiver) {
		const client = requireDb();
		const value = Reflect.get(client, prop, receiver);
		return typeof value === "function" ? value.bind(client) : value;
	},
});

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/** Walks a driver error chain looking for a PostgreSQL SQLSTATE code. */
export function hasPgErrorCode(error: unknown, code: string): boolean {
	let current: unknown = error;
	for (let depth = 0; depth < 5 && current && typeof current === "object"; depth++) {
		const record = current as Record<string, unknown>;
		if (record.code === code || record.originalCode === code) return true;
		const meta = record.meta as Record<string, unknown> | undefined;
		const driverError = meta?.driverAdapterError as Record<string, unknown> | undefined;
		if (driverError && hasPgErrorCode(driverError, code)) return true;
		current = record.cause;
	}
	return false;
}

/** Prisma unique-constraint violation. */
export function isUniqueViolation(error: unknown): boolean {
	return hasPgErrorCode(error, "P2002") || hasPgErrorCode(error, "23505");
}
