import { getCurrentUser, homeFor } from "@/lib/server/current-user";
import { redirectToPath } from "@/lib/server/redirect";
import { deleteClientSession } from "@/lib/server/session";

/** Clears a cookie whose token is invalid or whose account no longer exists. */
export async function GET() {
	const user = await getCurrentUser();
	if (user) return redirectToPath(homeFor(user));
	await deleteClientSession();
	return redirectToPath("/");
}
