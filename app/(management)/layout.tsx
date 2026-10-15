import { logoutAdminAction } from "@/app/actions/auth";
import { AppShell } from "@/components/layouts/app-shell";
import type { NavItem } from "@/components/sidebar";
import { getCurrentAdmin } from "@/lib/server/current-user";

const NAV: NavItem[] = [
	{ name: "Agenda do dia", path: "/gestao", icon: "agenda", exact: true },
	{ name: "Serviços", path: "/gestao/servicos", icon: "services" },
	{ name: "Clientes", path: "/gestao/clientes", icon: "clients" },
];

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
	const user = await getCurrentAdmin();
	if (!user) return children;
	return (
		<AppShell user={user} items={NAV} settingsHref="/gestao/configuracoes" signOut={logoutAdminAction}>
			{children}
		</AppShell>
	);
}
