import { CalendarClockIcon, PawPrintIcon } from "lucide-react";

import { Status } from "@/components/ui/status";
import type { AppointmentStatus } from "@/lib/domain/appointment-status";
import { formatDateTime, formatTime } from "@/lib/format";

export type AppointmentCardData = {
	id: number;
	startsAt: Date;
	endsAt: Date;
	status: AppointmentStatus;
	serviceName: string;
	petName: string;
	notes: string | null;
};

export function AppointmentCard({
	appointment,
	timeZone,
	actions,
}: {
	appointment: AppointmentCardData;
	timeZone: string;
	actions?: React.ReactNode;
}) {
	return (
		<article className="flex flex-col gap-3 rounded-[12px] border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0 space-y-1.5">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="font-semibold text-foreground">{appointment.serviceName}</h3>
					<Status status={appointment.status} />
				</div>
				<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<CalendarClockIcon className="size-4" aria-hidden />
					<span>
						{formatDateTime(appointment.startsAt, timeZone)} até{" "}
						{formatTime(appointment.endsAt, timeZone)}
					</span>
				</p>
				<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<PawPrintIcon className="size-4" aria-hidden />
					<span>{appointment.petName}</span>
				</p>
				{appointment.notes && (
					<p className="text-sm text-muted-foreground">Observações: {appointment.notes}</p>
				)}
			</div>
			{actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
		</article>
	);
}
