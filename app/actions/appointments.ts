"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isMocksEnabled } from "@/lib/demo/enabled";
import { DomainError } from "@/lib/domain/errors";
import { mocksDomainBlocked, mocksFormBlocked } from "@/lib/demo/guard";
import { toActionError, type ActionResult, type FormState } from "@/lib/server/action-result";
import { requireClient } from "@/lib/server/current-user";
import {
	cancelBooking,
	createBooking,
	rescheduleBooking,
} from "@/lib/use-cases/booking/manage-booking";
import { optionalText, requiredUuid } from "@/lib/validation/form";

function readStartsAt(form: FormData): Date {
	const value = form.get("starts_at");
	const date = typeof value === "string" && value ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) throw new DomainError("Escolha um horário.");
	return date;
}

function readAppointmentId(value: unknown): number {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id < 1) throw new DomainError("Agendamento inválido.");
	return id;
}

function revalidateAgendas(): void {
	revalidatePath("/cliente", "layout");
	revalidatePath("/gestao", "layout");
}

export async function createAppointmentAction(
	_prev: FormState,
	formData: FormData,
): Promise<FormState> {
	if (isMocksEnabled()) return mocksFormBlocked() ?? { ok: false, error: "" };
	const user = await requireClient();
	try {
		await createBooking({
			clientId: user.clientId,
			petId: requiredUuid(formData, "pet_id", "o pet"),
			serviceId: requiredUuid(formData, "service_id", "o serviço"),
			startsAt: readStartsAt(formData),
			notes: optionalText(formData, "notes", 500, "As observações"),
		});
	} catch (error) {
		return toActionError(error, "createAppointmentAction");
	}
	revalidateAgendas();
	redirect("/cliente/agendamentos?criado=1");
}

export async function rescheduleAppointmentAction(
	_prev: FormState,
	formData: FormData,
): Promise<FormState> {
	if (isMocksEnabled()) return mocksFormBlocked() ?? { ok: false, error: "" };
	const user = await requireClient();
	try {
		await rescheduleBooking(
			user.clientId,
			readAppointmentId(formData.get("appointment_id")),
			readStartsAt(formData),
			optionalText(formData, "notes", 500, "As observações"),
		);
	} catch (error) {
		return toActionError(error, "rescheduleAppointmentAction");
	}
	revalidateAgendas();
	redirect("/cliente/agendamentos?remarcado=1");
}

export async function cancelAppointmentAction(appointmentId: number): Promise<ActionResult> {
	const blocked = mocksDomainBlocked();
	if (blocked) return blocked;
	const user = await requireClient();
	try {
		await cancelBooking(user.clientId, readAppointmentId(appointmentId));
	} catch (error) {
		return toActionError(error, "cancelAppointmentAction");
	}
	revalidateAgendas();
	return { ok: true, message: "Agendamento cancelado." };
}
