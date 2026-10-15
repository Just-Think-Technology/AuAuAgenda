import { DomainError } from "./errors.ts";

/** bcrypt ignores bytes past this length; reject instead of silently truncating. */
export const MAX_LOGIN_PASSWORD_LENGTH = 72;

export function assertLoginPassword(password: string): string {
	if (!password) throw new DomainError("E-mail e senha são obrigatórios.");
	if (password.length > MAX_LOGIN_PASSWORD_LENGTH) {
		throw new DomainError("A senha deve ter no máximo 72 caracteres.");
	}
	return password;
}
