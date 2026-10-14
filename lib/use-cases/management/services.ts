import "server-only";

import {
	countSpecies,
	insertService,
	softDeleteService,
	updateService,
	type ServiceInput,
} from "@/lib/dal/services";
import { DomainError } from "@/lib/domain/errors";

export const SERVICE_DURATION = { min: 5, max: 720 } as const;

export async function saveService(serviceId: string | null, input: ServiceInput): Promise<string> {
	if (input.durationMinutes % 5 !== 0) {
		throw new DomainError("A duração deve ser múltipla de 5 minutos.");
	}
	const speciesIds = [...new Set(input.speciesIds)];
	if ((await countSpecies(speciesIds)) !== speciesIds.length) {
		throw new DomainError("Espécie inválida.");
	}
	const normalized = { ...input, speciesIds, sizes: [...new Set(input.sizes)] };

	if (!serviceId) {
		const created = await insertService(normalized);
		return created.service_id;
	}
	if (!(await updateService(serviceId, normalized))) {
		throw new DomainError("Serviço não encontrado.");
	}
	return serviceId;
}

export async function removeService(serviceId: string): Promise<void> {
	if (!(await softDeleteService(serviceId))) throw new DomainError("Serviço não encontrado.");
}
