import { Sidebar, type NavItem } from "@/components/sidebar";
import type { AuthUser } from "@/lib/types";

export function AppShell({
	user,
	items,
	settingsHref,
	signOut,
	children,
}: {
	user: AuthUser;
	items: NavItem[];
	settingsHref: string;
	signOut?: () => Promise<void>;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col md:flex-row min-h-dvh w-full">
			<Sidebar user={user} items={items} settingsHref={settingsHref} signOut={signOut} />
			<main className="flex-1 px-4 pt-6 pb-12 md:px-15 md:pt-16 w-full overflow-x-hidden">
				{children}
			</main>
		</div>
	);
}
