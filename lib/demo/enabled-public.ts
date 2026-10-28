/** Client-safe mirror of server `MOCKS` (set at build time in next.config). */
export function isMocksPublic(): boolean {
	return process.env.NEXT_PUBLIC_MOCKS === "true";
}
