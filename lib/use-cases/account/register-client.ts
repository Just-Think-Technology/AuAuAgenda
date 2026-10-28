import "server-only";

import { findActiveClientByPhone, insertClient } from "@/lib/dal/accounts";
import { DomainError } from "@/lib/domain/errors";
import { isUniqueViolation } from "@/lib/server/db";

const SIGNUP_CONFLICT = "Não foi possível concluir o cadastro com esses dados.";

export type NewClient = {
	name: string;
	phone: string;
};

export async function registerClient(input: NewClient): Promise<{ clientId: string }> {
	const phoneTaken = Boolean(await findActiveClientByPhone(input.phone));
	if (phoneTaken) throw new DomainError(SIGNUP_CONFLICT);

	try {
		const created = await insertClient({
			name: input.name,
			phone: input.phone,
		});
		return { clientId: created.client_id };
	} catch (error) {
		if (isUniqueViolation(error)) throw new DomainError(SIGNUP_CONFLICT);
		throw error;
	}
}
