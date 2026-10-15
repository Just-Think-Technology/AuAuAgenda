import "server-only";

import bcrypt from "bcrypt";

import {
	findAdminCredentialsByEmail,
	getAdminSessionVersion,
	updateAdminPasswordHash,
} from "@/lib/dal/accounts";
import { DomainError } from "@/lib/domain/errors";
import type { AdminClaims } from "@/lib/server/session";

export const BCRYPT_ROUNDS = 12;
/** Compared when no account matches so response time does not reveal which e-mails exist. */
const DUMMY_HASH = "$2b$10$1RBzoalrvk.VwHlndExZiurqPcvXG0NpsjfgRDftoVTPgMYc37S4i";

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Management sign-in. Customers enter with a phone number, not this password. */
export async function authenticateAdmin(email: string, password: string): Promise<AdminClaims> {
	const admin = await findAdminCredentialsByEmail(email);
	if (admin && (await bcrypt.compare(password, admin.password))) {
		if (bcrypt.getRounds(admin.password) < BCRYPT_ROUNDS) {
			await updateAdminPasswordHash(admin.admin_id, await hashPassword(password));
		}
		const sv = await getAdminSessionVersion(admin.admin_id);
		if (sv === null) throw new DomainError("E-mail ou senha incorretos.");
		return { role: "admin", admin_id: admin.admin_id, sv };
	}
	if (!admin) await bcrypt.compare(password, DUMMY_HASH);

	throw new DomainError("E-mail ou senha incorretos.");
}
