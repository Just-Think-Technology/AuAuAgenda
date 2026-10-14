import "server-only";

import { hasUpcomingBooking } from "@/lib/dal/appointments";
import {
	breedBelongsToSpecies,
	insertPet,
	softDeleteOwnedPet,
	speciesExists,
	updateOwnedPet,
	type PetInput,
} from "@/lib/dal/pets";
import { DomainError } from "@/lib/domain/errors";

async function assertCatalogReferences(input: PetInput): Promise<void> {
	if (!(await speciesExists(input.speciesId))) throw new DomainError("Espécie inválida.");
	if (input.breedId && !(await breedBelongsToSpecies(input.breedId, input.speciesId))) {
		throw new DomainError("A raça escolhida não pertence a essa espécie.");
	}
}

export async function savePet(cpf: string, petId: string | null, input: PetInput): Promise<void> {
	await assertCatalogReferences(input);
	if (!petId) {
		await insertPet(cpf, input);
		return;
	}
	if (!(await updateOwnedPet(petId, cpf, input))) throw new DomainError("Pet não encontrado.");
}

export async function deletePet(cpf: string, petId: string): Promise<void> {
	if (await hasUpcomingBooking({ petId }, new Date())) {
		throw new DomainError("Cancele os agendamentos futuros deste pet antes de excluí-lo.");
	}
	if (!(await softDeleteOwnedPet(petId, cpf))) throw new DomainError("Pet não encontrado.");
}
