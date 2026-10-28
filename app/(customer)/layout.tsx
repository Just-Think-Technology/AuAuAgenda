import { DemoAccountSeed } from "@/components/demo/account-seed";
import { AppShell } from "@/components/layouts/app-shell";
import type { NavItem } from "@/components/sidebar";
import { isMocksEnabled } from "@/lib/demo/enabled";
import { requireClient } from "@/lib/server/current-user";

const NAV: NavItem[] = [
	{ name: "Início", path: "/cliente", icon: "home", exact: true },
	{ name: "Agendamentos", path: "/cliente/agendamentos", icon: "calendar" },
	{ name: "Pets", path: "/cliente/pets", icon: "pets" },
];

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
	const user = await requireClient();
	return (
		<AppShell user={user} items={NAV} settingsHref="/cliente/configuracoes">
			{isMocksEnabled() ? <DemoAccountSeed cpf={user.clientId} /> : null}
			{children}
		</AppShell>
	);
}
