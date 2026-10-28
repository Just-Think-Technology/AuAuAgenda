import "server-only";

import { findActiveClientByPhone, insertPhoneClient } from "@/lib/dal/accounts";
import { PHONE_ACCOUNT_NAME } from "@/lib/domain/account-id";
import { DomainError } from "@/lib/domain/errors";
import { normalizePhone } from "@/lib/domain/phone";
import { isUniqueViolation } from "@/lib/server/db";

/**
 * Opens the customer account for this phone.
 * An existing active account is reused; a new one is created otherwise.
 * A lost race on the unique phone index signs in to the account that won.
 */
export async function continueWithPhone(input: string): Promise<{ clientId: string }> {
	const phone = normalizePhone(input);
	if (!phone) throw new DomainError("Telefone inválido.");

	const existing = await findActiveClientByPhone(phone);
	if (existing) return { clientId: existing.client_id };

	try {
		const created = await insertPhoneClient({
			name: PHONE_ACCOUNT_NAME,
			phone,
		});
		return { clientId: created.client_id };
	} catch (error) {
		if (!isUniqueViolation(error)) throw error;
		const winner = await findActiveClientByPhone(phone);
		if (winner) return { clientId: winner.client_id };
		throw error;
	}
}
