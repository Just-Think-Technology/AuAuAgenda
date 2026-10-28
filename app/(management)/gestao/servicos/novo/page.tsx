import type { Metadata } from "next";

import { MockManagementServiceForm } from "@/components/demo/pages/management-service-form";
import { PageHeader } from "@/components/layouts/page-header";
import { isMocksEnabled } from "@/lib/demo/enabled";
import { ServiceForm } from "@/components/management/service-form";
import { listSpecies } from "@/lib/dal/pets";
import { requireAdmin } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Novo serviço" };

export default async function NewServicePage() {
	await requireAdmin();
	if (isMocksEnabled()) return <MockManagementServiceForm serviceId={null} />;
	const species = await listSpecies();

	return (
		<div className="space-y-8">
			<PageHeader title="Novo serviço" />
			<ServiceForm service={null} species={species.map((s) => ({ id: s.species_id, name: s.name }))} />
		</div>
	);
}
