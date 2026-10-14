import "server-only";

import { headers } from "next/headers";

/**
 * Fixed-window limiter kept in process memory. On multi-instance or serverless
 * hosting each instance counts separately, so this is a best-effort brake on
 * brute force; a shared store is needed for a hard global limit.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp(): Promise<string> {
	const headerStore = await headers();
	return (
		headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		headerStore.get("x-real-ip") ||
		"unknown"
	);
}

/** Returns `true` while the key is under `max` hits in the current window. */
export function consumeRateLimit(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		if (buckets.size > 10_000) {
			for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
		}
		return true;
	}
	bucket.count += 1;
	return bucket.count <= max;
}
