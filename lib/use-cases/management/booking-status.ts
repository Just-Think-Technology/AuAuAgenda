import "server-only";

import { findBookingStatus, updateStatusIfCurrent } from "@/lib/dal/appointments";
import { assertTransition, type AppointmentStatus } from "@/lib/domain/appointment-status";
import { DomainError } from "@/lib/domain/errors";

/** Applies a staff status change; `expected` is the status the operator saw, to catch concurrent edits. */
export async function changeBookingStatus(
	appointmentId: number,
	expected: AppointmentStatus,
	to: AppointmentStatus,
): Promise<void> {
	const current = await findBookingStatus(appointmentId);
	if (!current) throw new DomainError("Agendamento não encontrado.");
	if (current.status !== expected) {
		throw new DomainError("O status mudou enquanto você editava. A agenda foi atualizada.");
	}
	assertTransition(current.status, to);

	const updated = await updateStatusIfCurrent(appointmentId, current.status, to);
	if (!updated) throw new DomainError("O status mudou enquanto você editava. A agenda foi atualizada.");
}
