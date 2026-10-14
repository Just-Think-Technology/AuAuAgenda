import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	assertCustomerCanChange,
	assertTransition,
	canCustomerChange,
	nextStatuses,
} from "./appointment-status.ts";
import { isValidCpf } from "./cpf.ts";
import { DomainError } from "./errors.ts";
import { eligibilityProblem } from "./service-eligibility.ts";

const DOG = "dog-id";
const CAT = "cat-id";

describe("service eligibility", () => {
	const service = { isActive: true, sizes: ["SMALL", "MEDIUM"] as const, speciesIds: [DOG] };

	it("accepts a matching pet", () => {
		assert.equal(eligibilityProblem(service, { size: "SMALL", speciesId: DOG }), null);
	});

	it("rejects inactive services, missing size, wrong size or species", () => {
		assert.match(
			eligibilityProblem({ ...service, isActive: false }, { size: "SMALL", speciesId: DOG }) ?? "",
			/não está disponível/,
		);
		assert.match(eligibilityProblem(service, { size: null, speciesId: DOG }) ?? "", /porte/);
		assert.match(eligibilityProblem(service, { size: "LARGE", speciesId: DOG }) ?? "", /porte/);
		assert.match(eligibilityProblem(service, { size: "SMALL", speciesId: CAT }) ?? "", /espécie/);
	});

	it("treats empty restrictions as accepting everyone", () => {
		const open = { isActive: true, sizes: [], speciesIds: [] };
		assert.equal(eligibilityProblem(open, { size: "LARGE", speciesId: null }), null);
	});
});

describe("appointment status", () => {
	it("allows the operational flow", () => {
		assertTransition("SCHEDULED", "CONFIRMED");
		assertTransition("CONFIRMED", "IN_SERVICE");
		assertTransition("IN_SERVICE", "COMPLETED");
	});

	it("rejects invalid transitions", () => {
		assert.throws(() => assertTransition("CANCELED", "COMPLETED"), DomainError);
		assert.throws(() => assertTransition("SCHEDULED", "COMPLETED"), DomainError);
		assert.throws(() => assertTransition("COMPLETED", "CANCELED"), DomainError);
		assert.deepEqual(nextStatuses("NO_SHOW"), []);
	});

	it("lets customers change only future, open appointments", () => {
		const now = new Date("2026-10-14T12:00:00Z");
		const future = new Date("2026-10-15T12:00:00Z");
		const past = new Date("2026-10-14T11:00:00Z");
		assert.equal(canCustomerChange("SCHEDULED", future, now), true);
		assert.equal(canCustomerChange("IN_SERVICE", future, now), false);
		assert.throws(() => assertCustomerCanChange("CONFIRMED", past, now), DomainError);
		assert.throws(() => assertCustomerCanChange("CANCELED", future, now), DomainError);
	});
});

describe("cpf", () => {
	it("validates check digits", () => {
		assert.equal(isValidCpf("529.982.247-25"), true);
		assert.equal(isValidCpf("529.982.247-24"), false);
		assert.equal(isValidCpf("111.111.111-11"), false);
	});
});
