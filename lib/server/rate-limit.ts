import "server-only";

import { headers } from "next/headers";

import { consumeRateLimitBucket } from "@/lib/dal/rate-limit";
import { resolveClientIp } from "@/lib/domain/client-ip";

export async function clientIp(): Promise<string> {
	const headerStore = await headers();
	return resolveClientIp({
		trustPlatformIp: process.env.TRUST_PLATFORM_IP === "1",
		realIp: headerStore.get("x-real-ip"),
		forwardedFor: headerStore.get("x-forwarded-for"),
	});
}

/** Returns `true` while the key is under `max` hits in the current window. */
export async function consumeRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
	return consumeRateLimitBucket(key, max, windowMs);
}
