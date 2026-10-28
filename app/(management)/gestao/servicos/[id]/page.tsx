import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MockManagementServiceForm } from "@/components/demo/pages/management-service-form";
import { PageHeader } from "@/components/layouts/page-header";
import { isMocksEnabled } from "@/lib/demo/enabled";
import { ServiceForm } from "@/components/management/service-form";
import { listSpecies } from "@/lib/dal/pets";
import { findService } from "@/lib/dal/services";
import { requireAdmin } from "@/lib/server/current-user";
import { isUuid } from "@/lib/validation/form";

export const metadata: Metadata = { title: "Editar serviço" };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
	await requireAdmin();
	const { id } = await params;
	if (!isUuid(id)) notFound();
	if (isMocksEnabled()) return <MockManagementServiceForm serviceId={id} />;
	const [service, species] = await Promise.all([findService(id), listSpecies()]);
	if (!service) notFound();

	return (
		<div className="space-y-8">
			<PageHeader title={`Editar ${service.name}`} />
			<ServiceForm service={service} species={species.map((s) => ({ id: s.species_id, name: s.name }))} />
		</div>
	);
}
