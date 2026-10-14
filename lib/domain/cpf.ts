export function normalizeCpf(cpf: string): string {
	return cpf.replace(/\D/g, "");
}

function checkDigit(digits: string, length: number): number {
	let sum = 0;
	for (let i = 0; i < length; i++) {
		sum += Number(digits[i]) * (length + 1 - i);
	}
	const remainder = sum % 11;
	return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(cpf: string): boolean {
	const digits = normalizeCpf(cpf);
	if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
	return (
		checkDigit(digits, 9) === Number(digits[9]) &&
		checkDigit(digits, 10) === Number(digits[10])
	);
}

export function formatCpf(cpf: string): string {
	const digits = normalizeCpf(cpf);
	if (digits.length !== 11) return cpf;
	return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
