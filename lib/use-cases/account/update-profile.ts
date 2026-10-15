import "server-only";

import {
	bumpClientSessionVersion,
	findActiveClientByPhone,
	findClientByCpf,
	findClientByEmail,
	findClientProfile,
	moveClientIdentity,
	updateClientProfile,
} from "@/lib/dal/accounts";
import { isValidCpf } from "@/lib/domain/cpf";
import { DomainError } from "@/lib/domain/errors";
import { normalizePhone } from "@/lib/domain/phone";
import { isUniqueViolation } from "@/lib/server/db";

const PROFILE_CONFLICT = "Não foi possível atualizar o perfil com esses dados.";

/** The phone stays the sign-in key. CPF and e-mail are optional contact data. */
export async function saveClientProfile(
	currentCpf: string,
	input: { name: string; phone: string; email: string | null; cpf: string | null },
): Promise<string> {
	const phone = normalizePhone(input.phone);
	if (!phone) throw new DomainError("Telefone inválido.");
	if (!input.cpf && isValidCpf(currentCpf)) throw new DomainError("O CPF não pode ser removido.");

	const current = await findClientProfile(currentCpf);
	if (!current) throw new DomainError("Conta não encontrada.");

	const nextCpf = input.cpf ?? currentCpf;
	if (nextCpf !== currentCpf && (await findClientByCpf(nextCpf))) {
		throw new DomainError(PROFILE_CONFLICT);
	}

	const phoneOwner = await findActiveClientByPhone(phone);
	if (phoneOwner && phoneOwner.cpf !== currentCpf) throw new DomainError(PROFILE_CONFLICT);

	if (input.email) {
		const emailOwner = await findClientByEmail(input.email);
		if (emailOwner && emailOwner.cpf !== currentCpf) throw new DomainError(PROFILE_CONFLICT);
	}

	const phoneChanged = current.phone !== phone;
	const identityChanged = nextCpf !== currentCpf;

	try {
		if (identityChanged) {
			const moved = await moveClientIdentity(currentCpf, nextCpf, {
				name: input.name,
				phone,
				email: input.email,
			});
			if (!moved) throw new DomainError("Conta não encontrada.");
			return nextCpf;
		}

		const saved = await updateClientProfile(currentCpf, {
			name: input.name,
			phone,
			email: input.email,
		});
		if (!saved) throw new DomainError("Conta não encontrada.");

		if (phoneChanged) await bumpClientSessionVersion(currentCpf);
		return currentCpf;
	} catch (error) {
		if (error instanceof DomainError) throw error;
		if (isUniqueViolation(error)) throw new DomainError(PROFILE_CONFLICT);
		throw error;
	}
}
