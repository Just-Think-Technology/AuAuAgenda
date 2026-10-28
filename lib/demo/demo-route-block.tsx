import { redirect } from "next/navigation";

import { isMocksEnabled } from "@/lib/demo/enabled";

/** Redirects demo visitors away from flows that need PostgreSQL or e-mail. */
export function blockDemoRoute(home = "/"): void {
	if (isMocksEnabled()) redirect(home);
}
