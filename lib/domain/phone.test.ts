import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPhoneAccountId, newPhoneAccountId } from "./account-id.ts";
import { isValidCpf } from "./cpf.ts";
import { normalizePhone } from "./phone.ts";

describe("normalizePhone", () => {
	it("keeps a national number and strips a leading country code", () => {
		assert.equal(normalizePhone("(11) 91234-5678"), "11912345678");
		assert.equal(normalizePhone("+55 11 91234-5678"), "11912345678");
		assert.equal(normalizePhone("5511912345678"), "11912345678");
		assert.equal(normalizePhone("55 11 1234-5678"), "1112345678");
	});

	it("keeps area code 55 when the number is already national", () => {
		assert.equal(normalizePhone("5551234567"), "5551234567");
	});

	it("rejects empty and impossible lengths", () => {
		assert.equal(normalizePhone(""), null);
		assert.equal(normalizePhone("123"), null);
		assert.equal(normalizePhone("55119123456789"), null);
		assert.equal(normalizePhone("0011912345678"), null);
	});
});

describe("phone account id", () => {
	it("fits the cpf column and is not a CPF", () => {
		const id = newPhoneAccountId();
		assert.equal(id.length, 15);
		assert.equal(isPhoneAccountId(id), true);
		assert.equal(isValidCpf(id), false);
	});
});
