"use server";

import { redirect } from "next/navigation";

import { isMocksEnabled } from "@/lib/demo/enabled";
import { bumpAdminSessionVersion, bumpClientSessionVersion, getClientSessionVersion } from "@/lib/dal/accounts";
import { DomainError } from "@/lib/domain/errors";
import { DEMO_ADMIN_IDENTITY } from "@/lib/demo/constants";
import { GENERIC_ERROR } from "@/lib/server/action-result";
import { MANAGEMENT_HOME, MANAGEMENT_LOGIN } from "@/lib/server/current-user";
import { clientIp, consumeRateLimit } from "@/lib/server/rate-limit";
import {
	createAdminSession,
	createClientSession,
	deleteAdminSession,
	deleteClientSession,
	readAdminSession,
	readClientSession,
} from "@/lib/server/session";
import { authenticateAdmin } from "@/lib/use-cases/account/credentials";
import { continueWithPhone } from "@/lib/use-cases/account/continue-with-phone";
import { loginPassword, requiredEmail, requiredPhone } from "@/lib/validation/form";

type AuthFormState = { error?: string } | undefined;

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const TOO_MANY_ATTEMPTS = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";

function errorMessage(error: unknown, context: string): string {
	if (error instanceof DomainError) return error.message;
	console.error(`[${context}]`, error instanceof Error ? error.message : "unknown error");
	return GENERIC_ERROR;
}

async function underLimit(scope: string, key: string, max: number): Promise<boolean> {
	const ip = await clientIp();
	return (
		(await consumeRateLimit(`${scope}:${key || ip}`, max, FIFTEEN_MINUTES)) &&
		(await consumeRateLimit(`${scope}:ip:${ip}`, max * 5, FIFTEEN_MINUTES))
	);
}

/** Demo only: refresh JWT after profile edits (no redirect). */
export async function mockSyncClientSessionAction(input: {
	clientId: string;
	name: string;
	sessionVersion: number;
}): Promise<{ error?: string }> {
	if (!isMocksEnabled()) return { error: GENERIC_ERROR };
	try {
		await createClientSession(input.clientId, input.sessionVersion, {
			name: input.name,
		});
	} catch (error) {
		return { error: errorMessage(error, "mockSyncClientSessionAction") };
	}
	return {};
}

/** Demo only: session from client-side localStorage account (MOCKS=true). */
export async function mockContinueWithPhoneAction(input: {
	clientId: string;
	name: string;
	sessionVersion: number;
}): Promise<{ error?: string }> {
	if (!isMocksEnabled()) return { error: GENERIC_ERROR };
	try {
		if (!(await underLimit("phone-login", input.clientId, 20))) return { error: TOO_MANY_ATTEMPTS };
		await createClientSession(input.clientId, input.sessionVersion, {
			name: input.name,
		});
	} catch (error) {
		return { error: errorMessage(error, "mockContinueWithPhoneAction") };
	}
	return {};
}

/** Demo only: admin session from the server-side seed identity (MOCKS=true). */
export async function mockAdminLoginAction(): Promise<{ error?: string }> {
	if (!isMocksEnabled()) return { error: GENERIC_ERROR };
	try {
		if (!(await underLimit("admin-login", "demo-admin", 20))) return { error: TOO_MANY_ATTEMPTS };
		await createAdminSession(DEMO_ADMIN_IDENTITY.adminId, DEMO_ADMIN_IDENTITY.sessionVersion, {
			name: DEMO_ADMIN_IDENTITY.name,
			email: DEMO_ADMIN_IDENTITY.email,
		});
	} catch (error) {
		return { error: errorMessage(error, "mockAdminLoginAction") };
	}
	return {};
}

/** Customer entry: the phone finds the account or creates it, then opens the session. */
export async function continueWithPhoneAction(
	_prev: AuthFormState,
	formData: FormData,
): Promise<AuthFormState> {
	if (isMocksEnabled()) {
		return { error: "Use o login por telefone na demonstração." };
	}
	try {
		const phone = requiredPhone(formData);
		if (!(await underLimit("phone-login", phone, 5))) return { error: TOO_MANY_ATTEMPTS };
		const { clientId } = await continueWithPhone(phone);
		const sessionVersion = await getClientSessionVersion(clientId);
		if (sessionVersion === null) throw new DomainError("Conta não encontrada.");
		await createClientSession(clientId, sessionVersion);
	} catch (error) {
		return { error: errorMessage(error, "continueWithPhoneAction") };
	}
	redirect("/cliente");
}

/** Management entry. Customers do not use e-mail and password. */
export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
	if (isMocksEnabled()) {
		return { error: "Use as credenciais de demonstração na tela de gestão." };
	}
	let destination: string;
	try {
		const email = requiredEmail(formData);
		const password = loginPassword(formData);
		if (!(await underLimit("admin-login", email, 10))) return { error: TOO_MANY_ATTEMPTS };

		const claims = await authenticateAdmin(email, password);
		await createAdminSession(claims.admin_id, claims.sv);
		destination = MANAGEMENT_HOME;
	} catch (error) {
		return { error: errorMessage(error, "loginAction") };
	}
	redirect(destination);
}

export async function logoutAction(): Promise<void> {
	const claims = await readClientSession();
	if (claims && !isMocksEnabled()) await bumpClientSessionVersion(claims.clientId);
	await deleteClientSession();
	redirect("/");
}

export async function logoutAdminAction(): Promise<void> {
	const claims = await readAdminSession();
	if (claims && !isMocksEnabled()) await bumpAdminSessionVersion(claims.admin_id);
	await deleteAdminSession();
	redirect(MANAGEMENT_LOGIN);
}
