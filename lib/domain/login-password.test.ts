import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DomainError } from "./errors.ts";
import { assertLoginPassword, MAX_LOGIN_PASSWORD_LENGTH } from "./login-password.ts";

describe("assertLoginPassword", () => {
	it("rejects an empty password", () => {
		assert.throws(() => assertLoginPassword(""), DomainError);
		assert.throws(() => assertLoginPassword(""), /E-mail e senha são obrigatórios/);
	});

	it("rejects passwords longer than the bcrypt limit", () => {
		const tooLong = "a".repeat(MAX_LOGIN_PASSWORD_LENGTH + 1);
		assert.throws(() => assertLoginPassword(tooLong), /no máximo 72 caracteres/);
	});

	it("accepts a 72-character password and a short legacy password", () => {
		assert.equal(assertLoginPassword("a".repeat(MAX_LOGIN_PASSWORD_LENGTH)).length, 72);
		assert.equal(assertLoginPassword("short"), "short");
	});
});
