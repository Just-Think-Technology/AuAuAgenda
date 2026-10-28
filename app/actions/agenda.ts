"use server";

import { revalidatePath } from "next/cache";

import { isAppointmentStatus } from "@/lib/domain/appointment-status";
import { mocksDomainBlocked } from "@/lib/demo/guard";
import { toActionError, type ActionResult } from "@/lib/server/action-result";
import { requireAdmin } from "@/lib/server/current-user";
import { changeBookingStatus } from "@/lib/use-cases/management/booking-status";

export async function changeAppointmentStatusAction(input: {
	appointmentId: number;
	from: string;
	to: string;
}): Promise<ActionResult> {
	const blocked = mocksDomainBlocked();
	if (blocked) return blocked;
	await requireAdmin();
	const { appointmentId, from, to } = input;
	if (!Number.isSafeInteger(appointmentId) || appointmentId < 1) {
		return { ok: false, error: "Agendamento inválido." };
	}
	if (!isAppointmentStatus(from) || !isAppointmentStatus(to)) {
		return { ok: false, error: "Status inválido." };
	}
	try {
		await changeBookingStatus(appointmentId, from, to);
	} catch (error) {
		revalidatePath("/gestao");
		return toActionError(error, "changeAppointmentStatusAction");
	}
	revalidatePath("/gestao", "layout");
	revalidatePath("/cliente", "layout");
	return { ok: true, message: "Status atualizado." };
}
