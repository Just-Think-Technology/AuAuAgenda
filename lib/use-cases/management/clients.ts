import "server-only";

import { softDeleteClient } from "@/lib/dal/accounts";
import { hasUpcomingBooking } from "@/lib/dal/appointments";
import { DomainError } from "@/lib/domain/errors";

export async function removeClient(cpf: string): Promise<void> {
	if (await hasUpcomingBooking({ clientCpf: cpf }, new Date())) {
		throw new DomainError("O cliente tem agendamentos futuros. Cancele-os na agenda antes de remover a conta.");
	}
	if (!(await softDeleteClient(cpf))) throw new DomainError("Cliente não encontrado.");
}
