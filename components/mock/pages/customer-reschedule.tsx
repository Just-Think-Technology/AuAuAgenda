"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { MockAvailableSlots } from "@/components/mock/mock-available-slots";
import { DatePicker } from "@/components/booking/date-picker";
import { StepSection } from "@/components/booking/step-section";
import { AppointmentCard } from "@/components/customer/appointment-card";
import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { canCustomerChange } from "@/lib/domain/appointment-status";
import { isWithinBookingWindow } from "@/lib/domain/availability";
import { isDateKey, todayKey } from "@/lib/domain/time-zone";
import { useMockStore } from "@/lib/mock/context";
import { findClientBooking, findServiceById, toShopSettings } from "@/lib/mock/mappers";
import type { AuthUser } from "@/lib/types";

export function MockCustomerReschedule({
	user,
	appointmentId,
}: {
	user: Extract<AuthUser, { role: "client" }>;
	appointmentId: number;
}) {
	const { store } = useMockStore();
	const params = useSearchParams();
	const booking = findClientBooking(store, appointmentId, user.cpf);
	if (!booking) notFound();
	const settings = toShopSettings(store);
	const service = findServiceById(store, booking.serviceId);

	const now = new Date();
	const path = `/cliente/agendamentos/${booking.id}/remarcar`;
	const dateParam = params.get("date");
	const dateKey =
		dateParam && isDateKey(dateParam) && isWithinBookingWindow(dateParam, now, settings.timeZone)
			? dateParam
			: null;
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
							<MockAvailableSlots
								mode="reschedule"
								clientCpf={user.cpf}
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
