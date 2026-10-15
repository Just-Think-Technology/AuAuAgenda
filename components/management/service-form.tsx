"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { saveServiceAction } from "@/app/actions/services";
import { isMocksPublic } from "@/lib/config/mocks-public";
import { DomainError } from "@/lib/domain/errors";
import { useMockDomainActions } from "@/lib/mock/client-actions";
import { parseServiceForm } from "@/lib/mock/parse-forms";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { PET_SIZE_LABELS, PET_SIZES, type PetSize } from "@/lib/domain/pet-size";
import { priceInputValue } from "@/lib/format";

export type ServiceFormValues = {
	id: string;
	name: string;
	description: string | null;
	durationMinutes: number;
	priceCents: number | null;
	isActive: boolean;
	sizes: PetSize[];
	speciesIds: string[];
};

const CHECK_CLASS =
	"flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5";

function CheckGroup({
	legend,
	hint,
	name,
	options,
	selected,
}: {
	legend: string;
	hint: string;
	name: string;
	options: { value: string; label: string }[];
	selected: readonly string[];
}) {
	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-1 text-sm font-medium">{legend}</legend>
			<div className="flex flex-wrap gap-2">
				{options.map((option) => (
					<label key={option.value} className={CHECK_CLASS}>
						<input
							type="checkbox"
							name={name}
							value={option.value}
							defaultChecked={selected.includes(option.value)}
							className="accent-primary"
						/>
						{option.label}
					</label>
				))}
			</div>
			<p className="text-xs text-muted-foreground">{hint}</p>
		</fieldset>
	);
}

export function ServiceForm({
	service,
	species,
}: {
	service: ServiceFormValues | null;
	species: { id: string; name: string }[];
}) {
	const mocks = isMocksPublic();
	const mockActions = useMockDomainActions();
	const router = useRouter();
	const [state, formAction, isPending] = useActionState(saveServiceAction, undefined);
	const [mockPending, startMock] = useTransition();
	useActionFeedback(state);

	function submitMock(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startMock(() => {
			try {
				const { serviceId, input } = parseServiceForm(formData);
				const result = mockActions.saveService(serviceId, input);
				if (!result.ok) throw new DomainError(result.error);
				router.push("/gestao/servicos?salvo=1");
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Erro ao salvar serviço.");
			}
		});
	}

	const pending = mocks ? mockPending : isPending;

	return (
		<form
			action={mocks ? undefined : formAction}
			onSubmit={mocks ? submitMock : undefined}
			className="max-w-3xl space-y-6"
		>
			{service && <input type="hidden" name="service_id" value={service.id} />}

			<div className="grid gap-4 sm:grid-cols-2">
				<Field htmlFor="service-name" label="Nome" className="sm:col-span-2">
					<Input id="service-name" name="name" required maxLength={120} defaultValue={service?.name} placeholder="Banho e tosa higiênica" />
				</Field>
				<Field htmlFor="service-description" label="Descrição (opcional)" className="sm:col-span-2">
					<Textarea id="service-description" name="description" maxLength={1000} defaultValue={service?.description ?? ""} />
				</Field>
				<Field htmlFor="service-duration" label="Duração (minutos)" hint="Bloqueia uma estação por esse tempo.">
					<Input
						id="service-duration"
						name="duration_minutes"
						type="number"
						required
						min={5}
						max={720}
						step={5}
						defaultValue={service?.durationMinutes ?? 60}
					/>
				</Field>
				<Field htmlFor="service-price" label="Preço (R$, opcional)" hint="Em branco aparece como “Sob consulta”.">
					<Input
						id="service-price"
						name="price"
						inputMode="decimal"
						placeholder="79,90"
						defaultValue={priceInputValue(service?.priceCents ?? null)}
					/>
				</Field>
			</div>

			<CheckGroup
				legend="Portes atendidos"
				hint="Nenhum marcado = todos os portes."
				name="sizes"
				options={PET_SIZES.map((size) => ({ value: size, label: PET_SIZE_LABELS[size] }))}
				selected={service?.sizes ?? []}
			/>
			<CheckGroup
				legend="Espécies atendidas"
				hint="Nenhuma marcada = todas as espécies."
				name="species_ids"
				options={species.map((s) => ({ value: s.id, label: s.name }))}
				selected={service?.speciesIds ?? []}
			/>

			<label className={`${CHECK_CLASS} w-fit`}>
				<input type="checkbox" name="is_active" defaultChecked={service?.isActive ?? true} className="accent-primary" />
				Disponível para agendamento
			</label>

			<div className="flex gap-2">
				<Button type="submit" disabled={pending}>
					{pending ? "Salvando…" : "Salvar serviço"}
				</Button>
				<Button asChild variant="outline">
					<Link href="/gestao/servicos">Cancelar</Link>
				</Button>
			</div>
		</form>
	);
}
