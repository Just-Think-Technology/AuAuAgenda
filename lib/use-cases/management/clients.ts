import "server-only";

import { softDeleteClient } from "@/lib/dal/accounts";
import { DomainError } from "@/lib/domain/errors";

/** Removes the account and related pets, bookings and recipes with soft delete. */
export async function removeClient(cpf: string): Promise<void> {
	if (!(await softDeleteClient(cpf))) throw new DomainError("Cliente não encontrado.");
}
