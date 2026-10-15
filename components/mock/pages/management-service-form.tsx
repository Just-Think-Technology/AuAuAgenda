"use client";

import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layouts/page-header";
import { ServiceForm } from "@/components/management/service-form";
import { useMockStore } from "@/lib/mock/context";
import { findServiceById } from "@/lib/mock/mappers";

export function MockManagementServiceForm({ serviceId }: { serviceId: string | null }) {
	const { store } = useMockStore();
	const species = store.species.map((s) => ({ id: s.speciesId, name: s.name }));
	const service = serviceId ? findServiceById(store, serviceId) : null;
	if (serviceId && !service) notFound();

	return (
		<div className="space-y-8">
			<PageHeader title={service ? "Editar serviço" : "Novo serviço"} />
			<ServiceForm
				species={species}
				service={
					service
						? {
								id: service.id,
								name: service.name,
								description: service.description,
								durationMinutes: service.durationMinutes,
								priceCents: service.priceCents,
								isActive: service.isActive,
								sizes: service.sizes,
								speciesIds: service.speciesIds,
							}
						: null
				}
			/>
		</div>
	);
}
