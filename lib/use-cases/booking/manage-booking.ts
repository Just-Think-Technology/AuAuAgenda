import "server-only";

import { findClientBooking, updateStatusIfCurrent } from "@/lib/dal/appointments";
import { assertCustomerCanChange } from "@/lib/domain/appointment-status";
import { DomainError } from "@/lib/domain/errors";
import { db } from "@/lib/server/db";

import { withStationRetry } from "./booking-context";
import { reserveSlot, type SlotRequest } from "./reserve-slot";

const CHANGED_MEANWHILE = "O agendamento foi alterado enquanto você editava. Atualize a página.";

export async function createBooking(request: SlotRequest): Promise<{ id: number }> {
	const created = await withStationRetry((tx) => reserveSlot(tx, request, new Date()));
	return { id: created.appointment_id };
}

export async function cancelBooking(cpf: string, appointmentId: number): Promise<void> {
	const booking = await findClientBooking(appointmentId, cpf);
	if (!booking) throw new DomainError("Agendamento não encontrado.");
	assertCustomerCanChange(booking.status, booking.startsAt, new Date());

	const updated = await updateStatusIfCurrent(appointmentId, booking.status, "CANCELED", db);
	if (!updated) throw new DomainError(CHANGED_MEANWHILE);
}

/**
 * Cancels the old booking and reserves the new slot in one transaction, so a
 * failed reservation leaves the original appointment untouched.
 */
export async function rescheduleBooking(
	cpf: string,
	appointmentId: number,
	startsAt: Date,
	notes: string | null,
): Promise<{ id: number }> {
	const created = await withStationRetry(async (tx) => {
		const now = new Date();
		const booking = await findClientBooking(appointmentId, cpf, tx);
		if (!booking) throw new DomainError("Agendamento não encontrado.");
		assertCustomerCanChange(booking.status, booking.startsAt, now);

		const canceled = await updateStatusIfCurrent(appointmentId, booking.status, "CANCELED", tx);
		if (!canceled) throw new DomainError(CHANGED_MEANWHILE);

		return reserveSlot(
			tx,
			{ cpf, petId: booking.petId, serviceId: booking.serviceId, startsAt, notes: notes ?? booking.notes },
			now,
		);
	});
	return { id: created.appointment_id };
}
