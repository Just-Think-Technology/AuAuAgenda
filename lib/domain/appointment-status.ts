import { DomainError } from "./errors.ts";

export const APPOINTMENT_STATUSES = [
	"SCHEDULED",
	"CONFIRMED",
	"IN_SERVICE",
	"COMPLETED",
	"CANCELED",
	"NO_SHOW",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
	SCHEDULED: "Agendado",
	CONFIRMED: "Confirmado",
	IN_SERVICE: "Em atendimento",
	COMPLETED: "Concluído",
	CANCELED: "Cancelado",
	NO_SHOW: "Não compareceu",
};

const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
	SCHEDULED: ["CONFIRMED", "IN_SERVICE", "CANCELED", "NO_SHOW"],
	CONFIRMED: ["IN_SERVICE", "CANCELED", "NO_SHOW"],
	IN_SERVICE: ["COMPLETED"],
	COMPLETED: [],
	CANCELED: [],
	NO_SHOW: [],
};

/** Statuses in which the customer may still cancel or reschedule. */
const CUSTOMER_CHANGEABLE: readonly AppointmentStatus[] = ["SCHEDULED", "CONFIRMED"];

export function isAppointmentStatus(value: string): value is AppointmentStatus {
	return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

export function nextStatuses(from: AppointmentStatus): readonly AppointmentStatus[] {
	return TRANSITIONS[from];
}

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus): void {
	if (!TRANSITIONS[from].includes(to)) {
		throw new DomainError(
			`Não é possível mudar de "${STATUS_LABELS[from]}" para "${STATUS_LABELS[to]}".`,
		);
	}
}

export function canCustomerChange(
	status: AppointmentStatus,
	startsAt: Date,
	now: Date,
): boolean {
	return CUSTOMER_CHANGEABLE.includes(status) && startsAt.getTime() > now.getTime();
}

export function assertCustomerCanChange(
	status: AppointmentStatus,
	startsAt: Date,
	now: Date,
): void {
	if (!CUSTOMER_CHANGEABLE.includes(status)) {
		throw new DomainError("Este agendamento não pode mais ser alterado.");
	}
	if (startsAt.getTime() <= now.getTime()) {
		throw new DomainError("O horário deste agendamento já começou ou passou.");
	}
}
