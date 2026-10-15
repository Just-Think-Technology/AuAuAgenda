import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	DEMO_ADMIN_IDENTITY,
	MOCK_ADMIN_ID,
	MOCK_ADMIN_NAME,
	MOCK_ADMIN_SESSION_VERSION,
	MOCK_DEMO_ADMIN_EMAIL,
} from "./constants.ts";

describe("DEMO_ADMIN_IDENTITY", () => {
	it("is the fixed seed admin, with no caller-supplied fields", () => {
		assert.deepEqual(DEMO_ADMIN_IDENTITY, {
			adminId: MOCK_ADMIN_ID,
			name: MOCK_ADMIN_NAME,
			email: MOCK_DEMO_ADMIN_EMAIL,
			sessionVersion: MOCK_ADMIN_SESSION_VERSION,
		});
		assert.equal(Object.keys(DEMO_ADMIN_IDENTITY).sort().join(), "adminId,email,name,sessionVersion");
	});
});
