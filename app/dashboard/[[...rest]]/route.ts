import { NextResponse, type NextRequest } from "next/server";

/** Old clinic links and bookmarks land on the right area for the signed-in role. */
export function GET(request: NextRequest) {
	return NextResponse.redirect(new URL("/session", request.nextUrl));
}
