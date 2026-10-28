import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MockCustomerReschedule } from "@/components/demo/pages/customer-reschedule";
import { AvailableSlots } from "@/components/booking/available-slots";
import { isMocksEnabled } from "@/lib/demo/enabled";
import { DatePicker } from "@/components/booking/date-picker";
import { StepSection } from "@/components/booking/step-section";
import { AppointmentCard } from "@/components/customer/appointment-card";
import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { findClientBooking } from "@/lib/dal/appointments";
import { findService } from "@/lib/dal/services";
import { getShopSettings } from "@/lib/dal/shop";
import { canCustomerChange } from "@/lib/domain/appointment-status";
import { isWithinBookingWindow } from "@/lib/domain/availability";
import { isDateKey, todayKey } from "@/lib/domain/time-zone";
import { requireClient } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Remarcar agendamento" };

type Props = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ date?: string }>;
};

export default async function RescheduleAppointmentPage({ params, searchParams }: Props) {
	const user = await requireClient();
	const [{ id }, { date }] = await Promise.all([params, searchParams]);
	const appointmentId = Number(id);
	if (!Number.isSafeInteger(appointmentId) || appointmentId < 1) notFound();
	if (isMocksEnabled()) return <MockCustomerReschedule user={user} appointmentId={appointmentId} />;

	const [booking, settings] = await Promise.all([
		findClientBooking(appointmentId, user.clientId),
		getShopSettings(),
	]);
	if (!booking) notFound();
	const service = await findService(booking.serviceId);

	const now = new Date();
	const path = `/cliente/agendamentos/${booking.id}/remarcar`;
	const dateKey =
		date && isDateKey(date) && isWithinBookingWindow(date, now, settings.timeZone) ? date : null;
	const blockedReason = !canCustomerChange(booking.status, booking.startsAt, now)
		? "Este agendamento não pode mais ser remarcado"
		: !service?.isActive
			? "Este serviço não está mais disponível para remarcação"
			: null;

	return (
		<div className="space-y-10">
			<PageHeader
				title="Remarcar agendamento"
				description="O horário atual só é liberado quando o novo for confirmado."
			/>
			<AppointmentCard appointment={booking} timeZone={settings.timeZone} />

			{blockedReason || !service ? (
				<EmptyState
					title={blockedReason ?? ""}
					action={
						<Button asChild variant="outline">
							<Link href="/cliente/agendamentos">Voltar</Link>
						</Button>
					}
				/>
			) : (
				<>
					<StepSection step={1} title="Nova data">
						<DatePicker
							today={todayKey(now, settings.timeZone)}
							selected={dateKey}
							openingHours={settings.openingHours}
							path={path}
							params={{}}
						/>
					</StepSection>
					{dateKey && (
						<StepSection step={2} title="Novo horário">
							<AvailableSlots
								mode="reschedule"
								dateKey={dateKey}
								durationMinutes={service.durationMinutes}
								excludeId={booking.id}
								defaultNotes={booking.notes}
								hiddenFields={{ appointment_id: String(booking.id) }}
							/>
						</StepSection>
					)}
				</>
			)}
		</div>
	);
}
