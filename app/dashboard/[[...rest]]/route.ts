import { redirectToPath } from "@/lib/server/redirect";

/** Old clinic links and bookmarks land on the right area for the signed-in role. */
export function GET() {
	return redirectToPath("/session");
}
