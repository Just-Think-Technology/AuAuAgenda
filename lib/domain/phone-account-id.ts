import { randomBytes } from "node:crypto";

/** 15 characters, prefixed so it can never be confused with a valid CPF. */
export function newPhoneAccountId(): string {
	return `p${randomBytes(7).toString("hex")}`;
}
