import { redirect } from "next/navigation";

// The canonical reset page lives at /reset-password (matches the link emailed
// by the backend). Keep /forget working by forwarding to it with the token.
type ForgetPageProps = {
	searchParams: Promise<{ token?: string }>;
};

export default async function ForgetPage({ searchParams }: ForgetPageProps) {
	const { token } = await searchParams;

	redirect(
		token ? `/reset-password?token=${encodeURIComponent(token)}` : "/reset-password",
	);
}
