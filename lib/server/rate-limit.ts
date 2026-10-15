import "server-only";

import { headers } from "next/headers";

import { consumeRateLimitBucket } from "@/lib/dal/rate-limit";

export async function clientIp(): Promise<string> {
	const headerStore = await headers();
	const realIp = headerStore.get("x-real-ip")?.trim();
	if (realIp && process.env.TRUST_PLATFORM_IP === "1") return realIp;
	return "unknown";
}

/** Returns `true` while the key is under `max` hits in the current window. */
export async function consumeRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
	return consumeRateLimitBucket(key, max, windowMs);
}
