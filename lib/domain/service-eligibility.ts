import type { PetSize } from "./pet-size.ts";

/** Empty `sizes` or `speciesIds` mean the service accepts every size or species. */
export type ServiceRule = {
	isActive: boolean;
	sizes: readonly PetSize[];
	speciesIds: readonly string[];
};

export type PetProfile = {
	size: PetSize | null;
	speciesId: string | null;
};

/** Returns why the pet cannot take the service, or `null` when it can. */
export function eligibilityProblem(service: ServiceRule, pet: PetProfile): string | null {
	if (!service.isActive) return "Este serviço não está disponível no momento.";
	if (!pet.size) return "Informe o porte do pet antes de agendar.";
	if (service.sizes.length > 0 && !service.sizes.includes(pet.size)) {
		return "Este serviço não atende o porte do pet.";
	}
	if (
		service.speciesIds.length > 0 &&
		(!pet.speciesId || !service.speciesIds.includes(pet.speciesId))
	) {
		return "Este serviço não atende a espécie do pet.";
	}
	return null;
}

export function isServiceEligible(service: ServiceRule, pet: PetProfile): boolean {
	return eligibilityProblem(service, pet) === null;
}
