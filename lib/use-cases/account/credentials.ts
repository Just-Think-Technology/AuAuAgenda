import "server-only";

import bcrypt from "bcrypt";

import {
	findAdminCredentialsByEmail,
	getAdminSessionVersion,
	updateAdminPasswordHash,
} from "@/lib/dal/accounts";
import { verifyAdminPassword } from "@/lib/domain/admin-password";
import { DomainError } from "@/lib/domain/errors";
import type { AdminClaims } from "@/lib/server/session";

export const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Management sign-in. Customers enter with a phone number, not this password. */
export async function authenticateAdmin(email: string, password: string): Promise<AdminClaims> {
	const admin = await findAdminCredentialsByEmail(email);
	if (await verifyAdminPassword(password, admin?.password ?? null)) {
		if (!admin) throw new DomainError("E-mail ou senha incorretos.");
		if (bcrypt.getRounds(admin.password) < BCRYPT_ROUNDS) {
			await updateAdminPasswordHash(admin.admin_id, await hashPassword(password));
		}
		const sv = await getAdminSessionVersion(admin.admin_id);
		if (sv === null) throw new DomainError("E-mail ou senha incorretos.");
		return { role: "admin", admin_id: admin.admin_id, sv };
	}

	throw new DomainError("E-mail ou senha incorretos.");
}
