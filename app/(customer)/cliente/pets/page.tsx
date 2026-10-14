import type { Metadata } from "next";

import { PetsView } from "@/components/pets/pets-view";
import type { Option } from "@/components/pets/pet-form-dialog";
import { listBreeds, listPetsByOwner, listSpecies } from "@/lib/dal/pets";
import { requireClient } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Pets" };

export default async function CustomerPetsPage() {
	const user = await requireClient();
	const [pets, species, breeds] = await Promise.all([
		listPetsByOwner(user.cpf),
		listSpecies(),
		listBreeds(),
	]);

	const breedsBySpecies: Record<string, Option[]> = {};
	for (const breed of breeds) {
		if (!breed.species_id) continue;
		(breedsBySpecies[breed.species_id] ??= []).push({ id: breed.breed_id, name: breed.name });
	}

	return (
		<PetsView
			pets={pets}
			species={species.map((s) => ({ id: s.species_id, name: s.name }))}
			breedsBySpecies={breedsBySpecies}
		/>
	);
}
