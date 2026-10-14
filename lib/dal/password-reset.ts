import "server-only";

import { db } from "@/lib/server/db";

/** Stores a new token and invalidates any previous unused one for the client. */
export async function storeResetToken(data: {
	clientCpf: string;
	tokenHash: string;
	expiresAt: Date;
}) {
	const now = new Date();
	await db.$transaction([
		db.password_reset_token.updateMany({
			where: { client_cpf: data.clientCpf, used_at: null },
			data: { used_at: now },
		}),
		db.password_reset_token.create({
			data: {
				client_cpf: data.clientCpf,
				token_hash: data.tokenHash,
				expires_at: data.expiresAt,
			},
			select: { reset_token_id: true },
		}),
	]);
}

/** Consumes the token and sets the new password atomically. Returns `false` for invalid tokens. */
export async function consumeResetToken(tokenHash: string, passwordHash: string): Promise<boolean> {
	const now = new Date();
	return db.$transaction(async (tx) => {
		const token = await tx.password_reset_token.findUnique({
			where: { token_hash: tokenHash },
			select: {
				reset_token_id: true,
				client_cpf: true,
				used_at: true,
				expires_at: true,
				client: { select: { deleted_at: true } },
			},
		});
		if (!token || token.used_at || token.expires_at <= now || token.client.deleted_at) {
			return false;
		}

		const consumed = await tx.password_reset_token.updateMany({
			where: { reset_token_id: token.reset_token_id, used_at: null, expires_at: { gt: now } },
			data: { used_at: now },
		});
		if (consumed.count !== 1) return false;

		await tx.client.update({
			where: { cpf: token.client_cpf },
			data: { password: passwordHash, updated_at: now },
			select: { cpf: true },
		});
		return true;
	});
}
