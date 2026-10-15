"use server";

import { redirect } from "next/navigation";

import { isMocksEnabled } from "@/lib/config/mocks";
import { bumpAdminSessionVersion, bumpClientSessionVersion, getClientSessionVersion } from "@/lib/dal/accounts";
import { DomainError } from "@/lib/domain/errors";
import { DEMO_ADMIN_IDENTITY } from "@/lib/mock/constants";
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
import { requestPasswordReset, resetPassword } from "@/lib/use-cases/account/password-reset";
import { registerClient } from "@/lib/use-cases/account/register-client";
import {
	loginPassword,
	newPassword,
	optionalPhone,
	optionalText,
	rawPassword,
	requiredEmail,
	requiredPhone,
	requiredText,
} from "@/lib/validation/form";

type AuthFormState = { error?: string } | undefined;
type ResultFormState = { error?: string; success?: boolean } | undefined;

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

/** Customer entry: the phone finds the account or creates it, then opens the session. */
/** Demo only: refresh JWT after profile edits (no redirect). */
export async function mockSyncClientSessionAction(input: {
	cpf: string;
	name: string;
	email?: string | null;
	sessionVersion: number;
}): Promise<{ error?: string }> {
	if (!isMocksEnabled()) return { error: GENERIC_ERROR };
	try {
		await createClientSession(input.cpf, input.sessionVersion, {
			name: input.name,
			email: input.email ?? null,
		});
	} catch (error) {
		return { error: errorMessage(error, "mockSyncClientSessionAction") };
	}
	return {};
}

/** Demo only: session from client-side localStorage account (MOCKS=true). */
export async function mockContinueWithPhoneAction(input: {
	cpf: string;
	name: string;
	sessionVersion: number;
}): Promise<{ error?: string }> {
	if (!isMocksEnabled()) return { error: GENERIC_ERROR };
	try {
		if (!(await underLimit("phone-login", input.cpf, 20))) return { error: TOO_MANY_ATTEMPTS };
		await createClientSession(input.cpf, input.sessionVersion, {
			name: input.name,
			email: null,
		});
	} catch (error) {
		return { error: errorMessage(error, "mockContinueWithPhoneAction") };
	}
	return {};
}

/** Demo only: admin session from server-side seed identity (MOCKS=true, never production). */
export async function mockAdminLoginAction(): Promise<{ error?: string }> {
	if (!isMocksEnabled() || process.env.NODE_ENV === "production") return { error: GENERIC_ERROR };
	try {
		if (!(await underLimit("admin-login", "demo-admin", 20))) return { error: TOO_MANY_ATTEMPTS };
		await createAdminSession(DEMO_ADMIN_IDENTITY.adminId, DEMO_ADMIN_IDENTITY.sessionVersion, {
			name: DEMO_ADMIN_IDENTITY.name,
			email: DEMO_ADMIN_IDENTITY.email,
		});
	} catch (error) {
		return { error: errorMessage(error, "mockAdminLoginAction") };
	}
	redirect(MANAGEMENT_HOME);
}

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
		const { cpf } = await continueWithPhone(phone);
		const sessionVersion = await getClientSessionVersion(cpf);
		if (sessionVersion === null) throw new DomainError("Conta não encontrada.");
		await createClientSession(cpf, sessionVersion);
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

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
	if (isMocksEnabled()) {
		return { error: "Cadastro indisponível no modo demonstração." };
	}
	try {
		if (formData.get("terms") !== "on") {
			return { error: "Você precisa aceitar os termos de uso." };
		}
		const email = requiredEmail(formData);
		if (!(await underLimit("signup", email, 10))) return { error: TOO_MANY_ATTEMPTS };

		const password = rawPassword(formData);
		if (password.length < 8 || password.length > 72) {
			return { error: "A senha deve ter entre 8 e 72 caracteres." };
		}

		const { cpf } = await registerClient(
			{
				name: requiredText(formData, "name", "o nome", 255),
				cpf: requiredText(formData, "cpf", "o CPF", 20),
				email,
				password,
				birthDate: optionalText(formData, "birth_date", 30),
				phone: optionalPhone(formData),
			},
			{ requireBirthDate: true },
		);
		const sessionVersion = await getClientSessionVersion(cpf);
		if (sessionVersion === null) throw new DomainError("Conta não encontrada.");
		await createClientSession(cpf, sessionVersion);
	} catch (error) {
		return { error: errorMessage(error, "signupAction") };
	}
	redirect("/cliente");
}

export async function forgotPasswordAction(
	_prev: ResultFormState,
	formData: FormData,
): Promise<ResultFormState> {
	if (isMocksEnabled()) {
		return { error: "Recuperação de senha indisponível no modo demonstração." };
	}
	try {
		const email = requiredEmail(formData);
		if (!(await underLimit("forgot", email, 5))) return { error: TOO_MANY_ATTEMPTS };
		await requestPasswordReset(email);
		return { success: true };
	} catch (error) {
		if (error instanceof DomainError) return { error: error.message };
		console.error("[forgotPasswordAction]", error instanceof Error ? error.message : "unknown");
		return { error: "Não foi possível enviar o e-mail de recuperação. Tente novamente." };
	}
}

export async function resetPasswordAction(
	_prev: ResultFormState,
	formData: FormData,
): Promise<ResultFormState> {
	if (isMocksEnabled()) {
		return { error: "Recuperação de senha indisponível no modo demonstração." };
	}
	try {
		const token = optionalText(formData, "token", 128);
		if (!token) return { error: "Link de recuperação inválido ou ausente. Solicite um novo." };
		if (!(await underLimit("reset", "", 5))) return { error: TOO_MANY_ATTEMPTS };
		await resetPassword(token, newPassword(formData));
		return { success: true };
	} catch (error) {
		return { error: errorMessage(error, "resetPasswordAction") };
	}
}

export async function logoutAction(): Promise<void> {
	const claims = await readClientSession();
	if (claims && !isMocksEnabled()) await bumpClientSessionVersion(claims.cpf);
	await deleteClientSession();
	redirect("/");
}

export async function logoutAdminAction(): Promise<void> {
	const claims = await readAdminSession();
	if (claims && !isMocksEnabled()) await bumpAdminSessionVersion(claims.admin_id);
	await deleteAdminSession();
	redirect(MANAGEMENT_LOGIN);
}
