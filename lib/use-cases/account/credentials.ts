import "server-only";

import bcrypt from "bcrypt";

import { findAdminCredentialsByEmail } from "@/lib/dal/accounts";
import { DomainError } from "@/lib/domain/errors";
import type { AdminClaims } from "@/lib/server/session";

const BCRYPT_ROUNDS = 10;
/** Compared when no account matches so response time does not reveal which e-mails exist. */
const DUMMY_HASH = "$2b$10$1RBzoalrvk.VwHlndExZiurqPcvXG0NpsjfgRDftoVTPgMYc37S4i";

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Management sign-in. Customers enter with a phone number, not this password. */
export async function authenticateAdmin(email: string, password: string): Promise<AdminClaims> {
	const admin = await findAdminCredentialsByEmail(email);
	if (admin && (await bcrypt.compare(password, admin.password))) {
		return { role: "admin", admin_id: admin.admin_id };
	}
	if (!admin) await bcrypt.compare(password, DUMMY_HASH);

	throw new DomainError("E-mail ou senha incorretos.");
}
