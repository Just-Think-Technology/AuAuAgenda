import "server-only";

import { findActiveClientByPhone, findClientConflicts, insertClient } from "@/lib/dal/accounts";
import { isValidCpf, normalizeCpf } from "@/lib/domain/cpf";
import { DomainError } from "@/lib/domain/errors";
import { isUniqueViolation } from "@/lib/server/db";
import { parseDateKey } from "@/lib/domain/time-zone";

import { hashPassword } from "./credentials";

/** Admin-created accounts may omit the birth date; the column is required, so a placeholder is stored. */
const UNKNOWN_BIRTH_DATE = new Date("1970-01-01T00:00:00Z");

export type NewClient = {
	cpf: string;
	name: string;
	email: string;
	password: string;
	birthDate: string | null;
	phone: string | null;
};

function parseBirthDate(value: string | null, required: boolean): Date {
	if (!value) {
		if (required) throw new DomainError("Informe a data de nascimento.");
		return UNKNOWN_BIRTH_DATE;
	}
	const parts = parseDateKey(value.slice(0, 10));
	if (!parts) throw new DomainError("Data de nascimento inválida.");
	const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
	if (date.getTime() > Date.now() || parts.year < 1900) {
		throw new DomainError("Data de nascimento inválida.");
	}
	return date;
}

export async function registerClient(
	input: NewClient,
	options: { requireBirthDate: boolean },
): Promise<{ cpf: string }> {
	const cpf = normalizeCpf(input.cpf);
	if (!isValidCpf(cpf)) throw new DomainError("CPF inválido.");
	const birthDate = parseBirthDate(input.birthDate, options.requireBirthDate);

	const conflicts = await findClientConflicts(cpf, input.email);
	if (conflicts.emailTaken) throw new DomainError("E-mail já cadastrado.");
	if (conflicts.cpfTaken) throw new DomainError("CPF já cadastrado.");
	if (input.phone && (await findActiveClientByPhone(input.phone))) {
		throw new DomainError("Telefone já cadastrado.");
	}

	try {
		return await insertClient({
			cpf,
			name: input.name,
			email: input.email,
			birthDate,
			passwordHash: await hashPassword(input.password),
			phone: input.phone,
		});
	} catch (error) {
		if (isUniqueViolation(error)) throw new DomainError("CPF, e-mail ou telefone já cadastrado.");
		throw error;
	}
}
