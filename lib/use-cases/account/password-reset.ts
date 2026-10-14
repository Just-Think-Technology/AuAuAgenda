import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { findClientCredentialsByEmail } from "@/lib/dal/accounts";
import { consumeResetToken, storeResetToken } from "@/lib/dal/password-reset";
import { DomainError } from "@/lib/domain/errors";
import { sendPasswordResetEmail } from "@/lib/server/email";

import { hashPassword } from "./credentials";

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

function ttlMinutes(): number {
	const ttl = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? 30);
	if (!Number.isInteger(ttl) || ttl < 1 || ttl > 120) {
		throw new Error("PASSWORD_RESET_TOKEN_TTL_MINUTES is invalid.");
	}
	return ttl;
}

function resetUrl(token: string): string {
	const base = process.env.PASSWORD_RESET_URL?.trim();
	if (!base) throw new Error("PASSWORD_RESET_URL is not configured.");
	const url = new URL(base);
	url.searchParams.set("token", token);
	return url.toString();
}

/** Always resolves the same way for unknown e-mails to avoid account enumeration. */
export async function requestPasswordReset(email: string): Promise<void> {
	const client = await findClientCredentialsByEmail(email);
	if (!client?.email) return;

	const minutes = ttlMinutes();
	const token = randomBytes(32).toString("hex");
	await storeResetToken({
		clientCpf: client.cpf,
		tokenHash: hashToken(token),
		expiresAt: new Date(Date.now() + minutes * 60_000),
	});
	await sendPasswordResetEmail({
		to: client.email,
		name: client.name,
		resetUrl: resetUrl(token),
		expiresInMinutes: minutes,
	});
}

export async function resetPassword(token: string, password: string): Promise<void> {
	const updated = await consumeResetToken(hashToken(token), await hashPassword(password));
	if (!updated) {
		throw new DomainError("Link de recuperação inválido ou expirado. Solicite um novo.");
	}
}
