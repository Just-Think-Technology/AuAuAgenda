"use client";

import { PageHeader } from "@/components/layouts/page-header";
import { ClientsView } from "@/components/management/clients/clients-view";
import { NewClientDialog } from "@/components/management/clients/new-client-dialog";
import { useMockStore } from "@/lib/mock/context";
import { listClientsWithPets } from "@/lib/mock/mappers";

export function MockManagementClients() {
	const { store } = useMockStore();
	const clients = listClientsWithPets(store);

	return (
		<div className="space-y-8">
			<PageHeader title="Clientes" description="Tutores cadastrados e seus pets." actions={<NewClientDialog />} />
			<ClientsView clients={clients} />
		</div>
	);
}
