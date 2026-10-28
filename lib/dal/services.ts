import "server-only";

import type { PetSize } from "@/lib/domain/pet-size";
import type { ServiceRule } from "@/lib/domain/service-eligibility";
import { db, type Tx } from "@/lib/server/db";

const serviceSelect = {
	service_id: true,
	name: true,
	description: true,
	duration_minutes: true,
	price_cents: true,
	is_active: true,
	sizes: true,
	service_species: { select: { species_id: true, species: { select: { name: true } } } },
} as const;

type ServiceRow = {
	service_id: string;
	name: string;
	description: string | null;
	duration_minutes: number;
	price_cents: number | null;
	is_active: boolean;
	sizes: PetSize[];
	service_species: { species_id: string; species: { name: string } }[];
};

function toService(row: ServiceRow) {
	return {
		id: row.service_id,
		name: row.name,
		description: row.description,
		durationMinutes: row.duration_minutes,
		priceCents: row.price_cents,
		isActive: row.is_active,
		sizes: row.sizes,
		speciesIds: row.service_species.map((s) => s.species_id),
		speciesNames: row.service_species.map((s) => s.species.name),
	};
}

export type Service = ReturnType<typeof toService>;

export function toRule(service: Service): ServiceRule {
	return { isActive: service.isActive, sizes: service.sizes, speciesIds: service.speciesIds };
}

export async function listServices(options: { activeOnly: boolean }): Promise<Service[]> {
	const rows = await db.service.findMany({
		where: { deleted_at: null, ...(options.activeOnly && { is_active: true }) },
		orderBy: { name: "asc" },
		select: serviceSelect,
	});
	return rows.map(toService);
}

export async function findService(serviceId: string, tx: Tx = db): Promise<Service | null> {
	const row = await tx.service.findFirst({
		where: { service_id: serviceId, deleted_at: null },
		select: serviceSelect,
	});
	return row && toService(row);
}

export type ServiceInput = {
	name: string;
	description: string | null;
	durationMinutes: number;
	priceCents: number | null;
	isActive: boolean;
	sizes: PetSize[];
	speciesIds: string[];
};

function toColumns(input: ServiceInput) {
	return {
		name: input.name,
		description: input.description,
		duration_minutes: input.durationMinutes,
		price_cents: input.priceCents,
		is_active: input.isActive,
		sizes: input.sizes,
	};
}

export async function insertService(input: ServiceInput) {
	return db.service.create({
		data: {
			...toColumns(input),
			service_species: { create: input.speciesIds.map((species_id) => ({ species_id })) },
		},
		select: { service_id: true },
	});
}

export async function updateService(serviceId: string, input: ServiceInput): Promise<boolean> {
	return db.$transaction(async (tx) => {
		const result = await tx.service.updateMany({
			where: { service_id: serviceId, deleted_at: null },
			data: { ...toColumns(input), updated_at: new Date() },
		});
		if (result.count !== 1) return false;
		await tx.service_species.deleteMany({ where: { service_id: serviceId } });
		await tx.service_species.createMany({
			data: input.speciesIds.map((species_id) => ({ service_id: serviceId, species_id })),
		});
		return true;
	});
}

/** Existing appointments keep pointing to the service, so it is only hidden. */
export async function softDeleteService(serviceId: string): Promise<boolean> {
	const now = new Date();
	const result = await db.service.updateMany({
		where: { service_id: serviceId, deleted_at: null },
		data: { deleted_at: now, is_active: false, updated_at: now },
	});
	return result.count === 1;
}

export async function countSpecies(ids: string[]): Promise<number> {
	if (ids.length === 0) return 0;
	return db.species.count({ where: { species_id: { in: ids }, deleted_at: null } });
}
