import type { Metadata } from "next";

import { PageHeader } from "@/components/layouts/page-header";
import { ClientsView } from "@/components/management/clients/clients-view";
import { NewClientDialog } from "@/components/management/clients/new-client-dialog";
import { listClientsWithPets } from "@/lib/dal/accounts";
import { requireAdmin } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage() {
	await requireAdmin();
	const clients = await listClientsWithPets();

	return (
		<div className="space-y-8">
			<PageHeader title="Clientes" description="Tutores cadastrados e seus pets." actions={<NewClientDialog />} />
			<ClientsView clients={clients} />
		</div>
	);
}
