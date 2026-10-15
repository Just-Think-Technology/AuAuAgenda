import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveClientIp, UNKNOWN_CLIENT_IP } from "./client-ip.ts";

describe("resolveClientIp", () => {
	it("returns unknown when the platform IP is not trusted", () => {
		assert.equal(
			resolveClientIp({
				trustPlatformIp: false,
				realIp: "203.0.113.10",
				forwardedFor: "198.51.100.1",
			}),
			UNKNOWN_CLIENT_IP,
		);
	});

	it("prefers a valid x-real-ip", () => {
		assert.equal(
			resolveClientIp({
				trustPlatformIp: true,
				realIp: "203.0.113.10",
				forwardedFor: "198.51.100.1, 10.0.0.1",
			}),
			"203.0.113.10",
		);
	});

	it("uses the first x-forwarded-for hop when x-real-ip is missing", () => {
		assert.equal(
			resolveClientIp({
				trustPlatformIp: true,
				realIp: "  ",
				forwardedFor: "198.51.100.1, 10.0.0.1",
			}),
			"198.51.100.1",
		);
	});

	it("ignores invalid addresses and falls through", () => {
		assert.equal(
			resolveClientIp({
				trustPlatformIp: true,
				realIp: "not-an-ip",
				forwardedFor: "198.51.100.1",
			}),
			"198.51.100.1",
		);
		assert.equal(
			resolveClientIp({
				trustPlatformIp: true,
				realIp: "999.1.1.1",
				forwardedFor: "nope",
			}),
			UNKNOWN_CLIENT_IP,
		);
	});

	it("accepts IPv6 and strips a TCP port", () => {
		assert.equal(
			resolveClientIp({
				trustPlatformIp: true,
				realIp: "2001:db8::1",
				forwardedFor: null,
			}),
			"2001:db8::1",
		);
		assert.equal(
			resolveClientIp({
				trustPlatformIp: true,
				realIp: "203.0.113.10:443",
				forwardedFor: null,
			}),
			"203.0.113.10",
		);
		assert.equal(
			resolveClientIp({
				trustPlatformIp: true,
				realIp: "[2001:db8::1]:443",
				forwardedFor: null,
			}),
			"2001:db8::1",
		);
	});
});
