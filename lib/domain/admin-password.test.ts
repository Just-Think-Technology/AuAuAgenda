import assert from "node:assert/strict";
import { describe, it } from "node:test";

import bcrypt from "bcrypt";

import { verifyAdminPassword } from "./admin-password.ts";

const PASSWORD = "correct-horse";
const OTHER = "wrong-battery";

describe("verifyAdminPassword", () => {
	it("accepts the matching hash", async () => {
		const hash = await bcrypt.hash(PASSWORD, 4);
		assert.equal(await verifyAdminPassword(PASSWORD, hash), true);
	});

	it("rejects a wrong password when a hash exists", async () => {
		const hash = await bcrypt.hash(PASSWORD, 4);
		assert.equal(await verifyAdminPassword(OTHER, hash), false);
	});

	it("rejects a missing account after a dummy compare", async () => {
		assert.equal(await verifyAdminPassword(PASSWORD, null), false);
	});
});
