import { Status } from "@/components/ui/status";
import type { AgendaEntry } from "@/lib/dal/appointments";
import { translateBreedName } from "@/lib/breed-translations";
import { PET_SIZE_LABELS } from "@/lib/domain/pet-size";
import { formatPhone, formatTime } from "@/lib/format";

import { StatusActions } from "./status-actions";

function Line({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<p className="text-sm">
			<span className="text-muted-foreground">{label}: </span>
			<span className="text-foreground">{children}</span>
		</p>
	);
}

export function AgendaEntryCard({ entry, timeZone }: { entry: AgendaEntry; timeZone: string }) {
	const start = formatTime(entry.startsAt, timeZone);
	const end = formatTime(entry.endsAt, timeZone);
	const petDetails = [
		entry.speciesName,
		entry.breedName && translateBreedName(entry.breedName),
		entry.petSize && `porte ${PET_SIZE_LABELS[entry.petSize].toLowerCase()}`,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<article className="grid gap-4 rounded-[12px] border bg-white p-4 md:grid-cols-[7rem_1fr_auto] md:items-start">
			<div className="flex items-baseline gap-2 md:flex-col md:gap-0.5">
				<p className="text-lg font-semibold tabular-nums">{start}</p>
				<p className="text-sm text-muted-foreground tabular-nums">até {end}</p>
				<p className="text-xs text-muted-foreground">Estação {entry.station}</p>
			</div>

			<div className="min-w-0 space-y-1.5">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="font-semibold">
						{entry.serviceName} · {entry.petName}
					</h3>
					<Status status={entry.status} />
				</div>
				{petDetails && <p className="text-sm text-muted-foreground">{petDetails}</p>}
				<Line label="Tutor">
					{entry.clientName}
					{entry.clientPhone && ` · ${formatPhone(entry.clientPhone)}`}
				</Line>
				{entry.petNotes && <Line label="Sobre o pet">{entry.petNotes}</Line>}
				{entry.notes && <Line label="Pedido do cliente">{entry.notes}</Line>}
			</div>

			<StatusActions
				appointmentId={entry.id}
				status={entry.status}
				summary={`${entry.serviceName} de ${entry.petName} às ${start}`}
			/>
		</article>
	);
}
