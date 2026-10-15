/** Browser-safe opaque account id (same shape as server `newPhoneAccountId`). */
export function newPhoneAccountId(): string {
	const hex = crypto.getRandomValues(new Uint8Array(7));
	return `p${Array.from(hex, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function newUuid(): string {
	return crypto.randomUUID();
}
