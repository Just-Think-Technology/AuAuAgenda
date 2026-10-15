"use client";

import { PetsView } from "@/components/pets/pets-view";
import type { Option } from "@/components/pets/pet-form-dialog";
import { useMockStore } from "@/lib/mock/context";
import { listPetsByOwner } from "@/lib/mock/mappers";
import type { AuthUser } from "@/lib/types";

export function MockCustomerPets({ user }: { user: Extract<AuthUser, { role: "client" }> }) {
	const { store } = useMockStore();
	const pets = listPetsByOwner(store, user.cpf);
	const species: Option[] = store.species.map((s) => ({ id: s.speciesId, name: s.name }));
	const breedsBySpecies: Record<string, Option[]> = {};
	for (const breed of store.breeds.filter((b) => !b.deletedAt)) {
		(breedsBySpecies[breed.speciesId] ??= []).push({ id: breed.breedId, name: breed.name });
	}

	return <PetsView pets={pets} species={species} breedsBySpecies={breedsBySpecies} clientCpf={user.cpf} />;
}
