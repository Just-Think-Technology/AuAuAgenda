import { isValidCpf, normalizeCpf } from "@/lib/domain/cpf";
import { DomainError } from "@/lib/domain/errors";
import { normalizePhone } from "@/lib/domain/phone";

/**
 * Small readers for `FormData` that throw `DomainError` with field-level
 * messages, so Server Actions validate every input on the server.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

function raw(form: FormData, key: string): string {
	const value = form.get(key);
	return typeof value === "string" ? value : "";
}

export function optionalText(
	form: FormData,
	key: string,
	maxLength: number,
	label = "Este campo",
): string | null {
	const value = raw(form, key).trim();
	if (!value) return null;
	if (value.length > maxLength) {
		throw new DomainError(`${label} aceita no máximo ${maxLength} caracteres.`);
	}
	return value;
}

export function requiredText(form: FormData, key: string, label: string, maxLength: number): string {
	const value = optionalText(form, key, maxLength, label.charAt(0).toUpperCase() + label.slice(1));
	if (!value) throw new DomainError(`Informe ${label}.`);
	return value;
}

export function requiredInt(
	form: FormData,
	key: string,
	label: string,
	{ min, max }: { min: number; max: number },
): number {
	const value = Number(raw(form, key).trim());
	if (!Number.isInteger(value) || value < min || value > max) {
		throw new DomainError(`${label} deve ser um número inteiro entre ${min} e ${max}.`);
	}
	return value;
}

export function requiredUuid(form: FormData, key: string, label: string): string {
	const value = raw(form, key).trim();
	if (!UUID_PATTERN.test(value)) throw new DomainError(`Selecione ${label}.`);
	return value;
}

export function optionalUuid(form: FormData, key: string): string | null {
	const value = raw(form, key).trim();
	if (!value) return null;
	if (!UUID_PATTERN.test(value)) throw new DomainError("Seleção inválida.");
	return value;
}

export function isUuid(value: string): boolean {
	return UUID_PATTERN.test(value);
}

export function uuidList(form: FormData, key: string): string[] {
	const values = form.getAll(key).filter((v): v is string => typeof v === "string");
	if (values.some((v) => !UUID_PATTERN.test(v))) throw new DomainError("Seleção inválida.");
	return [...new Set(values)];
}

export function oneOf<T extends string>(
	form: FormData,
	key: string,
	allowed: readonly T[],
	label: string,
): T {
	const value = raw(form, key).trim();
	if (!(allowed as readonly string[]).includes(value)) throw new DomainError(`Selecione ${label}.`);
	return value as T;
}

export function listOf<T extends string>(form: FormData, key: string, allowed: readonly T[]): T[] {
	const values = form.getAll(key).filter((v): v is string => typeof v === "string");
	if (values.some((v) => !(allowed as readonly string[]).includes(v))) {
		throw new DomainError("Seleção inválida.");
	}
	return [...new Set(values)] as T[];
}

export function requiredEmail(form: FormData, key = "email"): string {
	const value = raw(form, key).trim().toLowerCase();
	if (!value) throw new DomainError("Informe o e-mail.");
	if (value.length > 255 || !EMAIL_PATTERN.test(value)) throw new DomainError("E-mail inválido.");
	return value;
}

export function optionalEmail(form: FormData, key = "email"): string | null {
	const value = raw(form, key).trim().toLowerCase();
	if (!value) return null;
	if (value.length > 255 || !EMAIL_PATTERN.test(value)) throw new DomainError("E-mail inválido.");
	return value;
}

/** Empty means the tutor has not informed a CPF yet. A filled value must be valid. */
export function optionalCpf(form: FormData, key = "cpf"): string | null {
	const value = raw(form, key).trim();
	if (!value) return null;
	const cpf = normalizeCpf(value);
	if (!isValidCpf(cpf)) throw new DomainError("CPF inválido.");
	return cpf;
}

export function newPassword(form: FormData, key = "password", confirmKey = "password_confirm"): string {
	const password = raw(form, key);
	const confirmation = raw(form, confirmKey);
	if (!password || !confirmation) throw new DomainError("Preencha a nova senha e a confirmação.");
	if (password !== confirmation) throw new DomainError("As senhas não coincidem.");
	if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
		throw new DomainError(`A senha deve ter entre ${MIN_PASSWORD_LENGTH} e 72 caracteres.`);
	}
	return password;
}

export function rawPassword(form: FormData, key = "password"): string {
	return raw(form, key);
}

export function requiredPhone(form: FormData, key = "phone"): string {
	const phone = normalizePhone(raw(form, key));
	if (!phone) throw new DomainError("Telefone inválido.");
	return phone;
}

export function optionalPhone(form: FormData, key = "phone"): string | null {
	const value = raw(form, key).trim();
	if (!value) return null;
	return requiredPhone(form, key);
}

/** Parses `49,90`, `49.90` or `R$ 49,90` into cents. Empty input means no price. */
export function optionalPriceCents(form: FormData, key: string): number | null {
	const value = raw(form, key).replace(/R\$\s?/i, "").trim();
	if (!value) return null;
	const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
	const amount = /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : Number.NaN;
	if (!Number.isFinite(amount) || amount > 100_000) throw new DomainError("Preço inválido.");
	return Math.round(amount * 100);
}

export function checkbox(form: FormData, key: string): boolean {
	return form.get(key) === "on" || form.get(key) === "true";
}
