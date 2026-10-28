import "server-only";

import type { PetSize } from "@/lib/domain/pet-size";
import { db } from "@/lib/server/db";

const petSelect = {
	pet_id: true,
	name: true,
	size: true,
	sex: true,
	birth_date: true,
	notes: true,
	image_url: true,
	species_id: true,
	breed_id: true,
	species: { select: { name: true } },
	breed: { select: { name: true } },
} as const;

export async function listPetsByOwner(clientId: string) {
	return db.pet.findMany({
		where: { client_id: clientId, deleted_at: null },
		orderBy: { name: "asc" },
		select: petSelect,
	});
}

export type OwnedPet = Awaited<ReturnType<typeof listPetsByOwner>>[number];

/** Returns the pet only when it belongs to `clientId`. */
export async function findOwnedPet(petId: string, clientId: string) {
	return db.pet.findFirst({
		where: { pet_id: petId, client_id: clientId, deleted_at: null },
		select: petSelect,
	});
}

export async function listSpecies() {
	return db.species.findMany({
		where: { deleted_at: null },
		orderBy: { name: "asc" },
		select: { species_id: true, name: true },
	});
}

export async function listBreeds() {
	return db.breed.findMany({
		where: { deleted_at: null },
		orderBy: { name: "asc" },
		select: { breed_id: true, name: true, species_id: true },
	});
}

export async function breedBelongsToSpecies(breedId: string, speciesId: string) {
	const breed = await db.breed.findFirst({
		where: { breed_id: breedId, species_id: speciesId, deleted_at: null },
		select: { breed_id: true },
	});
	return Boolean(breed);
}

export async function speciesExists(speciesId: string) {
	const species = await db.species.findFirst({
		where: { species_id: speciesId, deleted_at: null },
		select: { species_id: true },
	});
	return Boolean(species);
}

export type PetInput = {
	name: string;
	speciesId: string;
	breedId: string | null;
	size: PetSize;
	sex: "male" | "female" | null;
	birthDate: Date | null;
	notes: string | null;
};

function toColumns(input: PetInput) {
	return {
		name: input.name,
		species_id: input.speciesId,
		breed_id: input.breedId,
		size: input.size,
		sex: input.sex,
		birth_date: input.birthDate,
		notes: input.notes,
	};
}

export async function insertPet(clientId: string, input: PetInput) {
	return db.pet.create({
		data: { ...toColumns(input), client_id: clientId },
		select: { pet_id: true },
	});
}

export async function updateOwnedPet(petId: string, clientId: string, input: PetInput) {
	const result = await db.pet.updateMany({
		where: { pet_id: petId, client_id: clientId, deleted_at: null },
		data: { ...toColumns(input), updated_at: new Date() },
	});
	return result.count === 1;
}

export async function softDeleteOwnedPet(petId: string, clientId: string) {
	const now = new Date();
	const result = await db.pet.updateMany({
		where: { pet_id: petId, client_id: clientId, deleted_at: null },
		data: { deleted_at: now, updated_at: now },
	});
	return result.count === 1;
}
