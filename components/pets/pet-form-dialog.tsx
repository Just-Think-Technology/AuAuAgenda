"use client";

import { useActionState, useState } from "react";

import { savePetAction } from "@/app/actions/pets";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { translateBreedName } from "@/lib/breed-translations";
import { PET_SIZE_HINTS, PET_SIZE_LABELS, PET_SIZES, type PetSize } from "@/lib/domain/pet-size";
import { dateInputValue } from "@/lib/format";

export type Option = { id: string; name: string };

export type EditablePet = {
	pet_id: string;
	name: string;
	species_id: string | null;
	breed_id: string | null;
	size: PetSize | null;
	sex: string | null;
	birth_date: Date | null;
	notes: string | null;
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	pet: EditablePet | null;
	species: Option[];
	breedsBySpecies: Record<string, Option[]>;
};

/** Mounted with a `key` per pet so field defaults reset when switching pets. */
export function PetFormDialog({ open, onOpenChange, pet, species, breedsBySpecies }: Props) {
	const [state, formAction, isPending] = useActionState(savePetAction, undefined);
	const [speciesId, setSpeciesId] = useState(pet?.species_id ?? "");
	const breeds = breedsBySpecies[speciesId] ?? [];
	useActionFeedback(state, () => onOpenChange(false));

	return (
		<Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{pet ? `Editar ${pet.name}` : "Cadastrar pet"}</DialogTitle>
					<DialogDescription>
						O porte define quais serviços estão disponíveis para o pet.
					</DialogDescription>
				</DialogHeader>

				<form action={formAction} className="grid gap-4 sm:grid-cols-2">
					{pet && <input type="hidden" name="pet_id" value={pet.pet_id} />}

					<Field htmlFor="pet-name" label="Nome" className="sm:col-span-2">
						<Input id="pet-name" name="name" required maxLength={100} defaultValue={pet?.name} />
					</Field>

					<Field htmlFor="pet-species" label="Espécie">
						<NativeSelect
							id="pet-species"
							name="species_id"
							required
							value={speciesId}
							onChange={(e) => setSpeciesId(e.target.value)}
						>
							<option value="" disabled>
								Selecione
							</option>
							{species.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</NativeSelect>
					</Field>

					<Field htmlFor="pet-breed" label="Raça (opcional)">
						<NativeSelect
							id="pet-breed"
							name="breed_id"
							key={speciesId}
							defaultValue={speciesId === pet?.species_id ? (pet?.breed_id ?? "") : ""}
							disabled={breeds.length === 0}
						>
							<option value="">Sem raça definida</option>
							{breeds.map((b) => (
								<option key={b.id} value={b.id}>
									{translateBreedName(b.name)}
								</option>
							))}
						</NativeSelect>
					</Field>

					<fieldset className="flex flex-col gap-2 sm:col-span-2">
						<legend className="mb-2 text-sm font-medium">Porte</legend>
						<div className="grid gap-2 sm:grid-cols-3">
							{PET_SIZES.map((size) => (
								<label
									key={size}
									className="flex cursor-pointer flex-col rounded-[10px] border p-3 text-sm has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
								>
									<input
										type="radio"
										name="size"
										value={size}
										required
										defaultChecked={pet?.size === size}
										className="sr-only"
									/>
									<span className="font-medium">{PET_SIZE_LABELS[size]}</span>
									<span className="text-xs text-muted-foreground">{PET_SIZE_HINTS[size]}</span>
								</label>
							))}
						</div>
					</fieldset>

					<Field htmlFor="pet-sex" label="Sexo (opcional)">
						<NativeSelect id="pet-sex" name="sex" defaultValue={pet?.sex ?? ""}>
							<option value="">Não informado</option>
							<option value="male">Macho</option>
							<option value="female">Fêmea</option>
						</NativeSelect>
					</Field>

					<Field htmlFor="pet-birth" label="Nascimento (opcional)">
						<Input
							id="pet-birth"
							name="birth_date"
							type="date"
							max={new Date().toISOString().slice(0, 10)}
							defaultValue={dateInputValue(pet?.birth_date ?? null)}
						/>
					</Field>

					<Field
						htmlFor="pet-notes"
						label="Observações (opcional)"
						hint="Comportamento, sensibilidades de pele, cuidados no banho."
						className="sm:col-span-2"
					>
						<Textarea id="pet-notes" name="notes" maxLength={500} defaultValue={pet?.notes ?? ""} />
					</Field>

					<DialogFooter className="sm:col-span-2">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
							Cancelar
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Salvando…" : "Salvar"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
