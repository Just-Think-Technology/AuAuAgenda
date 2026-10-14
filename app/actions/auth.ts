"use server";

import { redirect } from "next/navigation";

import { DomainError } from "@/lib/domain/errors";
import { GENERIC_ERROR } from "@/lib/server/action-result";
import { MANAGEMENT_HOME } from "@/lib/server/current-user";
import { clientIp, consumeRateLimit } from "@/lib/server/rate-limit";
import { createAdminSession, createClientSession, deleteAdminSession, deleteClientSession } from "@/lib/server/session";
import { continueWithPhone } from "@/lib/use-cases/account/continue-with-phone";
import { authenticateAdmin } from "@/lib/use-cases/account/credentials";
import { requestPasswordReset, resetPassword } from "@/lib/use-cases/account/password-reset";
import { registerClient } from "@/lib/use-cases/account/register-client";
import {
	optionalPhone,
	rawPassword,
	requiredEmail,
	requiredText,
	newPassword,
	optionalText,
	requiredPhone,
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
	return consumeRateLimit(`${scope}:${key || ip}`, max, FIFTEEN_MINUTES) &&
		consumeRateLimit(`${scope}:ip:${ip}`, max * 5, FIFTEEN_MINUTES);
}

/** Customer entry: the phone finds the account or creates it, then opens the same session. */
export async function continueWithPhoneAction(
	_prev: AuthFormState,
	formData: FormData,
): Promise<AuthFormState> {
	try {
		const phone = requiredPhone(formData);
		if (!(await underLimit("phone-login", phone, 5))) return { error: TOO_MANY_ATTEMPTS };
		const { cpf } = await continueWithPhone(phone);
		await createClientSession(cpf);
	} catch (error) {
		return { error: errorMessage(error, "continueWithPhoneAction") };
	}
	redirect("/cliente");
}

/** Management entry. Customers do not use e-mail and password. */
export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
	let destination: string;
	try {
		const email = requiredEmail(formData);
		const password = rawPassword(formData);
		if (!password) return { error: "E-mail e senha são obrigatórios." };
		if (!(await underLimit("admin-login", email, 10))) return { error: TOO_MANY_ATTEMPTS };

		const claims = await authenticateAdmin(email, password);
		await createAdminSession(claims.admin_id);
		destination = MANAGEMENT_HOME;
	} catch (error) {
		return { error: errorMessage(error, "loginAction") };
	}
	redirect(destination);
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
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
		await createClientSession(cpf);
	} catch (error) {
		return { error: errorMessage(error, "signupAction") };
	}
	redirect("/cliente");
}

export async function forgotPasswordAction(
	_prev: ResultFormState,
	formData: FormData,
): Promise<ResultFormState> {
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
	await deleteClientSession();
	redirect("/");
}

export async function logoutAdminAction(): Promise<void> {
	await deleteAdminSession();
	redirect(MANAGEMENT_HOME);
}
