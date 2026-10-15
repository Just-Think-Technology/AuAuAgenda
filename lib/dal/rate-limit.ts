import "server-only";

import { isMocksEnabled } from "@/lib/config/mocks";
import { db } from "@/lib/server/db";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function consumeMemoryBucket(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	const resetAt = now + windowMs;
	const row = memoryBuckets.get(key);
	if (!row || row.resetAt <= now) {
		memoryBuckets.set(key, { count: 1, resetAt });
		return true;
	}
	row.count += 1;
	return row.count <= max;
}

/** Atomically increments a fixed-window counter shared across app instances. */
export async function consumeRateLimitBucket(
	key: string,
	max: number,
	windowMs: number,
): Promise<boolean> {
	if (isMocksEnabled()) {
		return consumeMemoryBucket(key, max, windowMs);
	}

	const now = new Date();
	const resetAt = new Date(now.getTime() + windowMs);

	const rows = await db.$queryRaw<{ count: number }[]>`
		INSERT INTO auth_rate_limit (bucket_key, count, reset_at)
		VALUES (${key}, 1, ${resetAt})
		ON CONFLICT (bucket_key) DO UPDATE SET
			count = CASE
				WHEN auth_rate_limit.reset_at <= ${now} THEN 1
				ELSE auth_rate_limit.count + 1
			END,
			reset_at = CASE
				WHEN auth_rate_limit.reset_at <= ${now} THEN ${resetAt}
				ELSE auth_rate_limit.reset_at
			END
		RETURNING count
	`;

	const count = rows[0]?.count ?? 1;
	return count <= max;
}
