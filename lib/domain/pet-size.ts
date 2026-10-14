export const PET_SIZES = ["SMALL", "MEDIUM", "LARGE"] as const;

export type PetSize = (typeof PET_SIZES)[number];

export const PET_SIZE_LABELS: Record<PetSize, string> = {
	SMALL: "Pequeno",
	MEDIUM: "Médio",
	LARGE: "Grande",
};

export const PET_SIZE_HINTS: Record<PetSize, string> = {
	SMALL: "até 10 kg",
	MEDIUM: "de 10 a 25 kg",
	LARGE: "acima de 25 kg",
};

export function isPetSize(value: string): value is PetSize {
	return (PET_SIZES as readonly string[]).includes(value);
}
