import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";

import { MockManagementServices } from "@/components/demo/pages/management-services";
import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { isMocksEnabled } from "@/lib/demo/enabled";
import { DeleteServiceButton } from "@/components/management/delete-service-button";
import { Button } from "@/components/ui/button";
import { listServices } from "@/lib/dal/services";
import { PET_SIZE_LABELS } from "@/lib/domain/pet-size";
import { formatDuration, formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Serviços" };

type Props = { searchParams: Promise<{ salvo?: string }> };

export default async function ServicesPage({ searchParams }: Props) {
	await requireAdmin();
	if (isMocksEnabled()) return <MockManagementServices />;
	const [services, { salvo }] = await Promise.all([listServices({ activeOnly: false }), searchParams]);
	const newButton = (
		<Button asChild>
			<Link href="/gestao/servicos/novo">
				<PlusIcon />
				Novo serviço
			</Link>
		</Button>
	);

	return (
		<div className="space-y-8">
			<PageHeader
				title="Serviços"
				description="Catálogo exibido aos clientes, com duração, preço e pets atendidos."
				actions={newButton}
			/>
			{salvo && (
				<p role="status" className="rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
					Serviço salvo.
				</p>
			)}

			{services.length === 0 ? (
				<EmptyState
					title="Nenhum serviço cadastrado"
					description="Cadastre banho, tosa e outros serviços para liberar os agendamentos."
					action={newButton}
				/>
			) : (
				<ul className="grid gap-3 md:grid-cols-2">
					{services.map((service) => (
						<li key={service.id} className="flex flex-col gap-3 rounded-[12px] border bg-white p-4">
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="font-semibold">{service.name}</h2>
								{!service.isActive && (
									<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inativo</span>
								)}
							</div>
							{service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
							<p className="text-sm">
								{formatDuration(service.durationMinutes)} · {formatPrice(service.priceCents)}
							</p>
							<p className="text-sm text-muted-foreground">
								Portes:{" "}
								{service.sizes.length ? service.sizes.map((s) => PET_SIZE_LABELS[s]).join(", ") : "todos"}
								{" · "}Espécies: {service.speciesNames.length ? service.speciesNames.join(", ") : "todas"}
							</p>
							<div className="mt-auto flex gap-2">
								<Button asChild variant="outline" size="sm">
									<Link href={`/gestao/servicos/${service.id}`}>
										<PencilIcon />
										Editar
									</Link>
								</Button>
								<DeleteServiceButton serviceId={service.id} name={service.name} />
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
