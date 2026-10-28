import "server-only";

import { softDeleteClient } from "@/lib/dal/accounts";
import { DomainError } from "@/lib/domain/errors";

/** Removes the account and related pets and bookings with soft delete. */
export async function removeClient(clientId: string): Promise<void> {
	if (!(await softDeleteClient(clientId))) throw new DomainError("Cliente não encontrado.");
}
