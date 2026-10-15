"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { MockAvailableSlots } from "@/components/mock/mock-available-slots";
import { DatePicker } from "@/components/booking/date-picker";
import { ChoiceGrid, ChoiceLink, StepSection } from "@/components/booking/step-section";
import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { isWithinBookingWindow } from "@/lib/domain/availability";
import { PET_SIZE_LABELS } from "@/lib/domain/pet-size";
import { eligibilityProblem } from "@/lib/domain/service-eligibility";
import { isDateKey, todayKey } from "@/lib/domain/time-zone";
import { formatDuration, formatPrice } from "@/lib/format";
import { useMockStore } from "@/lib/mock/context";
import { activeServices, listPetsByOwner, toShopSettings } from "@/lib/mock/mappers";
import type { AuthUser } from "@/lib/types";

const PATH = "/cliente/agendamentos/novo";

function href(params: Record<string, string | undefined>): string {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
	return `${PATH}?${query}`;
}

export function MockCustomerNewBooking({ user }: { user: Extract<AuthUser, { role: "client" }> }) {
	const { store } = useMockStore();
	const params = useSearchParams();
	const now = new Date();
	const pets = listPetsByOwner(store, user.cpf);
	const services = activeServices(store, true);
	const settings = toShopSettings(store);

	const pet = pets.find((p) => p.pet_id === params.get("pet")) ?? null;
	const serviceOptions = pet
		? services.map((service) => ({
				service,
				problem: eligibilityProblem(
					{ isActive: service.isActive, sizes: service.sizes, speciesIds: service.speciesIds },
					{ size: pet.size, speciesId: pet.species_id },
				),
			}))
		: [];
	const service =
		serviceOptions.find((o) => o.service.id === params.get("service") && !o.problem)?.service ?? null;
	const today = todayKey(now, settings.timeZone);
	const dateParam = params.get("date");
	const dateKey =
		dateParam && isDateKey(dateParam) && isWithinBookingWindow(dateParam, now, settings.timeZone)
			? dateParam
			: null;

	if (pets.length === 0) {
		return (
			<div className="space-y-8">
				<PageHeader title="Novo agendamento" />
				<EmptyState
					title="Cadastre um pet para agendar"
					action={
						<Button asChild>
							<Link href="/cliente/pets">Cadastrar pet</Link>
						</Button>
					}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-10">
			<PageHeader title="Novo agendamento" description="Escolha o pet, o serviço e um horário livre." />

			<StepSection step={1} title="Pet">
				<ChoiceGrid>
					{pets.map((p) => (
						<ChoiceLink
							key={p.pet_id}
							href={href({ pet: p.pet_id })}
							selected={p.pet_id === pet?.pet_id}
							title={p.name}
							details={[p.species?.name, p.size && `Porte ${PET_SIZE_LABELS[p.size].toLowerCase()}`]
								.filter(Boolean)
								.join(" · ")}
						/>
					))}
				</ChoiceGrid>
			</StepSection>

			{pet && (
				<StepSection step={2} title="Serviço">
					<ChoiceGrid>
						{serviceOptions.map(({ service: s, problem }) => (
							<ChoiceLink
								key={s.id}
								href={href({ pet: pet.pet_id, service: s.id, date: dateParam ?? undefined })}
								selected={s.id === service?.id}
								title={s.name}
								details={`${formatDuration(s.durationMinutes)} · ${formatPrice(s.priceCents)}`}
								unavailableReason={problem}
							/>
						))}
					</ChoiceGrid>
					{!pet.size && (
						<Button asChild variant="link" className="px-0">
							<Link href="/cliente/pets">Informar o porte de {pet.name}</Link>
						</Button>
					)}
				</StepSection>
			)}

			{pet && service && (
				<StepSection step={3} title="Data">
					<DatePicker
						today={today}
						selected={dateKey}
						openingHours={settings.openingHours}
						path={PATH}
						params={{ pet: pet.pet_id, service: service.id }}
					/>
				</StepSection>
			)}

			{pet && service && dateKey && (
				<StepSection step={4} title="Horário">
					<MockAvailableSlots
						mode="create"
						clientCpf={user.cpf}
						dateKey={dateKey}
						durationMinutes={service.durationMinutes}
						hiddenFields={{ pet_id: pet.pet_id, service_id: service.id }}
					/>
				</StepSection>
			)}
		</div>
	);
}
