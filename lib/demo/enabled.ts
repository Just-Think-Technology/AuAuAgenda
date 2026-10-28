import "server-only";

/** Demo mode: no PostgreSQL; client persists data in localStorage. */
export function isMocksEnabled(): boolean {
	return process.env.MOCKS === "true";
}
