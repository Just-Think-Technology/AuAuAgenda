/** Canonical Brazilian phone: area code + number, without the 55 country code. */
export function normalizePhone(input: string): string | null {
	const digits = input.replace(/\D/g, "");
	const national =
		(digits.length === 12 || digits.length === 13) && digits.startsWith("55")
			? digits.slice(2)
			: digits;
	if (national.length < 10 || national.length > 11) return null;
	return national;
}
