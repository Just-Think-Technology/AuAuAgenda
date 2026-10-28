import { getCurrentUser, homeFor } from "@/lib/server/current-user";
import { redirectToPath } from "@/lib/server/redirect";

/** Sends a signed-in user to the area of their role. */
export async function GET() {
	const user = await getCurrentUser();
	const target = user ? homeFor(user) : "/session/expired";
	return redirectToPath(target);
}
