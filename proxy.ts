import { type NextRequest, NextResponse } from "next/server";

/** Must match the cookie names in lib/server/session.ts. */
const CLIENT_COOKIE = "pet-connect:token";

const customerPrefixes = ["/cliente", "/dashboard"];
const guestOnlyRoutes = ["/", "/cadastro"];

/**
 * Optimistic redirect based on cookie presence only. Pages, layouts and
 * Server Actions verify the token expiry and the account in the database.
 * `/gestao` is not gated here: the management layout shows login when the
 * admin cookie is missing or no longer valid.
 */
export default function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const hasClient = Boolean(req.cookies.get(CLIENT_COOKIE)?.value);

	const isCustomerArea = customerPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);

	if (isCustomerArea && !hasClient) {
		return NextResponse.redirect(new URL("/", req.nextUrl));
	}
	if (guestOnlyRoutes.includes(pathname) && hasClient) {
		return NextResponse.redirect(new URL("/session", req.nextUrl));
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|session|_next/static|_next/image|.*\\.png$).*)"],
};
