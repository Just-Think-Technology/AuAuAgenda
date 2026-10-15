"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { AgendaEntryCard } from "@/components/management/agenda-entry-card";
import { AgendaFilters, agendaHref, type AgendaQuery } from "@/components/management/agenda-filters";
import { Button } from "@/components/ui/button";
import {
	isAppointmentStatus,
	STATUS_LABELS,
	type AppointmentStatus,
} from "@/lib/domain/appointment-status";
import { dayRange, isDateKey, todayKey } from "@/lib/domain/time-zone";
import { formatDateKey } from "@/lib/format";
import { useMockStore } from "@/lib/mock/context";
import { activeServices, listDayAgenda, toShopSettings } from "@/lib/mock/mappers";
import { isUuid } from "@/lib/validation/form";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function MockManagementAgenda() {
	const { store } = useMockStore();
	const params = useSearchParams();
	const settings = toShopSettings(store);
	const services = activeServices(store, false);
	const today = todayKey(new Date(), settings.timeZone);
	const statusParam = params.get("status");
	const query: AgendaQuery = {
		date: params.get("date") && isDateKey(params.get("date")!) ? params.get("date")! : today,
		status:
			statusParam && isAppointmentStatus(statusParam) ? (statusParam as AppointmentStatus) : null,
		serviceId: params.get("service") && isUuid(params.get("service")!) ? params.get("service")! : null,
	};
	const entries = listDayAgenda(store, { ...dayRange(query.date, settings.timeZone), ...query });
	const active = entries.filter((e) => e.status !== "CANCELED" && e.status !== "NO_SHOW").length;
	const filtered = Boolean(query.status || query.serviceId);

	return (
		<div className="space-y-8">
			<PageHeader
				title="Agenda do dia"
				description={[
					capitalize(formatDateKey(query.date)),
					`${active} ${active === 1 ? "atendimento ativo" : "atendimentos ativos"}`,
					query.status && `filtrado por ${STATUS_LABELS[query.status].toLowerCase()}`,
				]
					.filter(Boolean)
					.join(" · ")}
			/>
			<AgendaFilters
				query={query}
				today={today}
				services={services.map((s) => ({ id: s.id, name: s.name }))}
			/>

			{entries.length === 0 ? (
				<EmptyState
					title={filtered ? "Nenhum agendamento com esses filtros" : "Nenhum agendamento neste dia"}
					action={
						filtered && (
							<Button asChild variant="outline">
								<Link href={agendaHref({ date: query.date, status: null, serviceId: null })}>Limpar filtros</Link>
							</Button>
						)
					}
				/>
			) : (
				<ul className="flex flex-col gap-3" aria-label="Agendamentos do dia">
					{entries.map((entry) => (
						<li key={entry.id}>
							<AgendaEntryCard entry={entry} timeZone={settings.timeZone} />
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
