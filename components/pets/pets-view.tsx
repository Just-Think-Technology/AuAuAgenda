"use client";

import { useState, useTransition } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { deletePetAction } from "@/app/actions/pets";
import { isMocksPublic } from "@/lib/config/mocks-public";
import { useMockDomainActions } from "@/lib/mock/client-actions";
import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { PetCard, type PetCardData } from "./pet-card";
import { PetFormDialog, type EditablePet, type Option } from "./pet-form-dialog";

export type PetViewItem = PetCardData & EditablePet;

type FormTarget = { pet: PetViewItem | null; key: number };

export function PetsView({
	pets,
	species,
	breedsBySpecies,
	clientCpf,
}: {
	pets: PetViewItem[];
	species: Option[];
	breedsBySpecies: Record<string, Option[]>;
	clientCpf?: string;
}) {
	const mocks = isMocksPublic() && Boolean(clientCpf);
	const mockActions = useMockDomainActions();
	const [form, setForm] = useState<FormTarget | null>(null);
	const [toDelete, setToDelete] = useState<PetViewItem | null>(null);
	const [isDeleting, startDelete] = useTransition();

	const openForm = (pet: PetViewItem | null) => setForm({ pet, key: Date.now() });
	const addButton = (
		<Button onClick={() => openForm(null)}>
			<PlusIcon />
			Cadastrar pet
		</Button>
	);

	function confirmDelete() {
		if (!toDelete) return;
		startDelete(async () => {
			const result =
				mocks && clientCpf
					? mockActions.deletePet(clientCpf, toDelete.pet_id)
					: await deletePetAction(toDelete.pet_id);
			if (result.ok) {
				toast.success(result.message);
				setToDelete(null);
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<div className="space-y-8">
			<PageHeader title="Pets" description="Mantenha porte e observações atualizados." actions={addButton} />

			{pets.length === 0 ? (
				<EmptyState
					title="Nenhum pet cadastrado"
					description="Cadastre seu pet para ver os serviços disponíveis para ele."
					action={addButton}
				/>
			) : (
				<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{pets.map((pet) => (
						<li key={pet.pet_id}>
							<PetCard
								pet={pet}
								actions={
									<>
										<Button variant="outline" size="sm" onClick={() => openForm(pet)}>
											<PencilIcon />
											Editar
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="text-destructive"
											onClick={() => setToDelete(pet)}
										>
											<Trash2Icon />
											Excluir
										</Button>
									</>
								}
							/>
						</li>
					))}
				</ul>
			)}

			{form && (
				<PetFormDialog
					key={form.key}
					open
					onOpenChange={(open) => !open && setForm(null)}
					pet={form.pet}
					species={species}
					breedsBySpecies={breedsBySpecies}
					clientCpf={clientCpf}
				/>
			)}

			<Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && !isDeleting && setToDelete(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="gap-2">
						<DialogTitle>Excluir {toDelete?.name}?</DialogTitle>
						<DialogDescription>
							O pet deixa de aparecer na sua conta. Pets com agendamentos futuros não podem ser excluídos.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setToDelete(null)} disabled={isDeleting}>
							Cancelar
						</Button>
						<Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
							{isDeleting ? "Excluindo…" : "Excluir"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
