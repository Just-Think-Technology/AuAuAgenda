import "server-only";

import {
	bumpClientSessionVersion,
	findActiveClientByPhone,
	findClientProfile,
	updateClientProfile,
} from "@/lib/dal/accounts";
import { DomainError } from "@/lib/domain/errors";
import { normalizePhone } from "@/lib/domain/phone";
import { isUniqueViolation } from "@/lib/server/db";

const PROFILE_CONFLICT = "Não foi possível atualizar o perfil com esses dados.";

/** The phone stays the sign-in key. Name and phone are required. */
export async function saveClientProfile(
	clientId: string,
	input: { name: string; phone: string },
): Promise<void> {
	const phone = normalizePhone(input.phone);
	if (!phone) throw new DomainError("Telefone inválido.");

	const current = await findClientProfile(clientId);
	if (!current) throw new DomainError("Conta não encontrada.");

	const phoneOwner = await findActiveClientByPhone(phone);
	if (phoneOwner && phoneOwner.client_id !== clientId) throw new DomainError(PROFILE_CONFLICT);

	try {
		const saved = await updateClientProfile(clientId, {
			name: input.name,
			phone,
		});
		if (!saved) throw new DomainError("Conta não encontrada.");
		if (current.phone !== phone) await bumpClientSessionVersion(clientId);
	} catch (error) {
		if (error instanceof DomainError) throw error;
		if (isUniqueViolation(error)) throw new DomainError(PROFILE_CONFLICT);
		throw error;
	}
}
