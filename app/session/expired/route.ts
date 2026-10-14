import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser, homeFor } from "@/lib/server/current-user";
import { deleteClientSession } from "@/lib/server/session";

/** Clears a cookie whose token is invalid or whose account no longer exists. */
export async function GET(req: NextRequest) {
	const user = await getCurrentUser();
	if (user) return NextResponse.redirect(new URL(homeFor(user), req.nextUrl));
	await deleteClientSession();
	return NextResponse.redirect(new URL("/", req.nextUrl));
}
