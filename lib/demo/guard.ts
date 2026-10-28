import "server-only";

import { isMocksEnabled } from "@/lib/demo/enabled";
import type { ActionResult } from "@/lib/types";

import { GENERIC_ERROR } from "@/lib/server/action-result";

/** Blocks domain Server Actions while the demo runs on localStorage. */
export function mocksDomainBlocked(): Extract<ActionResult, { ok: false }> | null {
	if (isMocksEnabled()) return { ok: false, error: GENERIC_ERROR };
	return null;
}

export function mocksFormBlocked(): Extract<ActionResult, { ok: false }> | null {
	return mocksDomainBlocked();
}
