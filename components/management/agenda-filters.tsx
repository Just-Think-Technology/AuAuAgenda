import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { APPOINTMENT_STATUSES, STATUS_LABELS, type AppointmentStatus } from "@/lib/domain/appointment-status";
import { addDays, type DateKey } from "@/lib/domain/time-zone";

export type AgendaQuery = { date: DateKey; status: AppointmentStatus | null; serviceId: string | null };

export function agendaHref(query: AgendaQuery): string {
	const params = new URLSearchParams({ date: query.date });
	if (query.status) params.set("status", query.status);
	if (query.serviceId) params.set("service", query.serviceId);
	return `/gestao?${params}`;
}

/** Plain GET form: filters live in the URL, so the agenda is shareable and rendered on the server. */
export function AgendaFilters({
	query,
	today,
	services,
}: {
	query: AgendaQuery;
	today: DateKey;
	services: { id: string; name: string }[];
}) {
	return (
		<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<nav aria-label="Navegar entre dias" className="flex items-center gap-2">
				<Button asChild variant="outline" size="icon" aria-label="Dia anterior">
					<Link href={agendaHref({ ...query, date: addDays(query.date, -1) })}>
						<ChevronLeftIcon />
					</Link>
				</Button>
				<Button asChild variant={query.date === today ? "default" : "outline"}>
					<Link href={agendaHref({ ...query, date: today })}>Hoje</Link>
				</Button>
				<Button asChild variant="outline" size="icon" aria-label="Próximo dia">
					<Link href={agendaHref({ ...query, date: addDays(query.date, 1) })}>
						<ChevronRightIcon />
					</Link>
				</Button>
			</nav>

			<form method="get" action="/gestao" className="flex flex-wrap items-end gap-3">
				<Field htmlFor="agenda-date" label="Data">
					<Input id="agenda-date" name="date" type="date" defaultValue={query.date} className="w-44" required />
				</Field>
				<Field htmlFor="agenda-status" label="Status">
					<NativeSelect id="agenda-status" name="status" defaultValue={query.status ?? ""} className="w-44">
						<option value="">Todos</option>
						{APPOINTMENT_STATUSES.map((status) => (
							<option key={status} value={status}>
								{STATUS_LABELS[status]}
							</option>
						))}
					</NativeSelect>
				</Field>
				<Field htmlFor="agenda-service" label="Serviço">
					<NativeSelect id="agenda-service" name="service" defaultValue={query.serviceId ?? ""} className="w-48">
						<option value="">Todos</option>
						{services.map((service) => (
							<option key={service.id} value={service.id}>
								{service.name}
							</option>
						))}
					</NativeSelect>
				</Field>
				<Button type="submit" variant="outline">
					Filtrar
				</Button>
			</form>
		</div>
	);
}
