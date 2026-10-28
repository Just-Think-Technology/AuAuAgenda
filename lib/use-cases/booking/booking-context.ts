import "server-only";

import { findOwnedPet } from "@/lib/dal/pets";
import { findService, toRule } from "@/lib/dal/services";
import type { ShopSettings } from "@/lib/dal/shop";
import type { ShopSchedule } from "@/lib/domain/availability";
import { DomainError } from "@/lib/domain/errors";
import { eligibilityProblem } from "@/lib/domain/service-eligibility";
import { db, hasPgErrorCode, type Tx } from "@/lib/server/db";

const EXCLUSION_VIOLATION = "23P01";
const MAX_ATTEMPTS = 3;

export function toSchedule(settings: ShopSettings): ShopSchedule {
	return {
		timeZone: settings.timeZone,
		capacity: settings.capacity,
		slotIntervalMinutes: settings.slotIntervalMinutes,
		openingHours: settings.openingHours,
	};
}

/** Loads the pet (owned by this client) and the service, enforcing eligibility. */
export async function loadEligiblePair(
	cpf: string,
	petId: string,
	serviceId: string,
	tx: Tx = db,
) {
	const [pet, service] = await Promise.all([
		findOwnedPet(petId, cpf),
		findService(serviceId, tx),
	]);
	if (!pet) throw new DomainError("Pet não encontrado.");
	if (!service) throw new DomainError("Serviço não encontrado.");

	const problem = eligibilityProblem(toRule(service), {
		size: pet.size,
		speciesId: pet.species_id,
	});
	if (problem) throw new DomainError(problem);
	return { pet, service };
}

/**
 * Runs a booking transaction, retrying when PostgreSQL rejects a station
 * overlap because another request reserved it first.
 */
export async function withStationRetry<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await db.$transaction(work);
		} catch (error) {
			if (!hasPgErrorCode(error, EXCLUSION_VIOLATION)) throw error;
			if (attempt >= MAX_ATTEMPTS) {
				throw new DomainError("Este horário acabou de ficar indisponível. Escolha outro.");
			}
		}
	}
}
