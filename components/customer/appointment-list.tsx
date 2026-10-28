import Link from "next/link";

import { Button } from "@/components/ui/button";
import { canCustomerChange } from "@/lib/domain/appointment-status";
import { formatDateTime } from "@/lib/format";

import { AppointmentCard, type AppointmentCardData } from "./appointment-card";
import { CancelAppointmentButton } from "./cancel-appointment-button";

export function AppointmentList({
	appointments,
	timeZone,
	now,
	withActions,
	clientId,
}: {
	appointments: AppointmentCardData[];
	timeZone: string;
	now: Date;
	withActions: boolean;
	clientId?: string;
}) {
	return (
		<ul className="flex flex-col gap-3">
			{appointments.map((appointment) => {
				const changeable =
					withActions && canCustomerChange(appointment.status, appointment.startsAt, now);
				const summary = `${appointment.serviceName} de ${appointment.petName} em ${formatDateTime(appointment.startsAt, timeZone)}`;
				return (
					<li key={appointment.id}>
						<AppointmentCard
							appointment={appointment}
							timeZone={timeZone}
							actions={
								changeable && (
									<>
										<Button asChild variant="outline" size="sm">
											<Link href={`/cliente/agendamentos/${appointment.id}/remarcar`}>
												Remarcar
											</Link>
										</Button>
										<CancelAppointmentButton
											appointmentId={appointment.id}
											summary={summary}
											clientId={clientId}
										/>
									</>
								)
							}
						/>
					</li>
				);
			})}
		</ul>
	);
}
