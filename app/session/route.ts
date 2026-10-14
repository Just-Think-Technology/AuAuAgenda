import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser, homeFor } from "@/lib/server/current-user";

/** Sends a signed-in user to the area of their role. */
export async function GET(req: NextRequest) {
	const user = await getCurrentUser();
	const target = user ? homeFor(user) : "/session/expired";
	return NextResponse.redirect(new URL(target, req.nextUrl));
}
