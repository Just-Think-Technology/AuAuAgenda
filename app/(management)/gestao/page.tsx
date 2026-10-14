import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { AgendaEntryCard } from "@/components/management/agenda-entry-card";
import { AgendaFilters, agendaHref, type AgendaQuery } from "@/components/management/agenda-filters";
import { Button } from "@/components/ui/button";
import { listDayAgenda } from "@/lib/dal/appointments";
import { listServices } from "@/lib/dal/services";
import { getShopSettings } from "@/lib/dal/shop";
import { isAppointmentStatus, STATUS_LABELS } from "@/lib/domain/appointment-status";
import { dayRange, isDateKey, todayKey } from "@/lib/domain/time-zone";
import { formatDateKey } from "@/lib/format";
import { getCurrentAdmin } from "@/lib/server/current-user";
import { isUuid } from "@/lib/validation/form";

export async function generateMetadata(): Promise<Metadata> {
	if (!(await getCurrentAdmin())) return { title: "Acesso da equipe" };
	return { title: "Agenda do dia" };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type Props = { searchParams: Promise<{ date?: string; status?: string; service?: string }> };

export default async function DailyAgendaPage({ searchParams }: Props) {
	if (!(await getCurrentAdmin())) return null;
	const [params, settings, services] = await Promise.all([
		searchParams,
		getShopSettings(),
		listServices({ activeOnly: false }),
	]);
	const today = todayKey(new Date(), settings.timeZone);
	const query: AgendaQuery = {
		date: params.date && isDateKey(params.date) ? params.date : today,
		status: params.status && isAppointmentStatus(params.status) ? params.status : null,
		serviceId: params.service && isUuid(params.service) ? params.service : null,
	};
	const entries = await listDayAgenda({ ...dayRange(query.date, settings.timeZone), ...query });
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
