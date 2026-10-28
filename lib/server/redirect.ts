import "server-only";

import { NextResponse } from "next/server";

/**
 * Relative Location. An absolute URL built from `req.nextUrl` uses the
 * address Next is bound to. On Hostinger that is `0.0.0.0:3000`, so the
 * browser leaves the public domain.
 */
export function redirectToPath(path: string): NextResponse {
	if (!path.startsWith("/") || path.startsWith("//")) {
		throw new Error("Redirect path must be an absolute path on this site.");
	}
	return new NextResponse(null, {
		status: 307,
		headers: { location: path },
	});
}
