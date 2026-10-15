/** Shown until the tutor sets a name. Full-name match is how the home invites them to do it. */
export const PHONE_ACCOUNT_NAME = "Cliente";

/** Opaque account id stored in `client.cpf` when the person signed in with a phone only. */
const PHONE_ACCOUNT_ID = /^p[0-9a-f]{14}$/;

export function isPhoneAccountId(value: string): boolean {
	return PHONE_ACCOUNT_ID.test(value);
}
