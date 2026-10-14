import "server-only";

import {
	findActiveClientByPhone,
	findClientByCpf,
	findClientByEmail,
	moveClientIdentity,
	updateClientProfile,
} from "@/lib/dal/accounts";
import { isValidCpf } from "@/lib/domain/cpf";
import { DomainError } from "@/lib/domain/errors";
import { normalizePhone } from "@/lib/domain/phone";
import { isUniqueViolation } from "@/lib/server/db";

/** The phone stays the sign-in key. CPF and e-mail are optional contact data. */
export async function saveClientProfile(
	currentCpf: string,
	input: { name: string; phone: string; email: string | null; cpf: string | null },
): Promise<string> {
	const phone = normalizePhone(input.phone);
	if (!phone) throw new DomainError("Telefone inválido.");
	if (!input.cpf && isValidCpf(currentCpf)) throw new DomainError("O CPF não pode ser removido.");

	const nextCpf = input.cpf ?? currentCpf;
	if (nextCpf !== currentCpf && (await findClientByCpf(nextCpf))) {
		throw new DomainError("CPF já cadastrado.");
	}

	const phoneOwner = await findActiveClientByPhone(phone);
	if (phoneOwner && phoneOwner.cpf !== currentCpf) throw new DomainError("Este telefone já está em uso.");

	if (input.email) {
		const emailOwner = await findClientByEmail(input.email);
		if (emailOwner && emailOwner.cpf !== currentCpf) throw new DomainError("E-mail já cadastrado.");
	}

	try {
		if (nextCpf !== currentCpf) {
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
		return currentCpf;
	} catch (error) {
		if (error instanceof DomainError) throw error;
		if (isUniqueViolation(error)) throw new DomainError("CPF, e-mail ou telefone já cadastrado.");
		throw error;
	}
}
