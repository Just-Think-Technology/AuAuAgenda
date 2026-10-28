"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteClientAction } from "@/app/actions/admin-clients";
import { isMocksPublic } from "@/lib/demo/enabled-public";
import { useMockDomainActions } from "@/lib/demo/client-actions";
import { PetCard } from "@/components/pets/pet-card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPhone } from "@/lib/format";

import { buildColumns, type ManagedClient } from "./columns";
import { DataTable } from "./data-table";

export function ClientsView({ clients }: { clients: ManagedClient[] }) {
	const mocks = isMocksPublic();
	const mockActions = useMockDomainActions();
	const [activeId, setActiveId] = useState<string | null>(null);
	const [idToDelete, setIdToDelete] = useState<string | null>(null);
	const [isDeleting, startDelete] = useTransition();
	const columns = useMemo(() => buildColumns({ onDelete: setIdToDelete }), []);
	const active = clients.find((c) => c.client_id === activeId) ?? null;
	const toDelete = clients.find((c) => c.client_id === idToDelete) ?? null;

	function confirmDelete() {
		if (!idToDelete) return;
		startDelete(async () => {
			const result = mocks
				? mockActions.removeClient(idToDelete)
				: await deleteClientAction(idToDelete);
			if (result.ok) {
				toast.success(result.message);
				if (activeId === idToDelete) setActiveId(null);
				setIdToDelete(null);
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<>
			<DataTable
				columns={columns}
				data={clients}
				onRowClick={(row) => setActiveId(row.client_id)}
				isRowActive={(row) => row.client_id === activeId}
			/>

			<Sheet open={Boolean(active)} onOpenChange={(open) => !open && setActiveId(null)}>
				<SheetContent className="w-full overflow-y-auto sm:max-w-md">
					{active && (
						<>
							<SheetHeader>
								<SheetTitle>{active.name}</SheetTitle>
								<SheetDescription>{formatPhone(active.phone)}</SheetDescription>
							</SheetHeader>
							<div className="flex flex-col gap-3 px-4 pb-6">
								<h3 className="font-semibold">Pets ({active.pet.length})</h3>
								{active.pet.length === 0 ? (
									<p className="text-sm text-muted-foreground">Nenhum pet cadastrado.</p>
								) : (
									active.pet.map((pet) => <PetCard key={pet.pet_id} pet={pet} />)
								)}
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>

			<Dialog open={Boolean(idToDelete)} onOpenChange={(open) => !open && !isDeleting && setIdToDelete(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="gap-2">
						<DialogTitle>Remover {toDelete?.name}?</DialogTitle>
						<DialogDescription>
							A conta, os pets e os agendamentos deste cliente saem da operação. Os registros ficam arquivados.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIdToDelete(null)} disabled={isDeleting}>
							Voltar
						</Button>
						<Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
							{isDeleting ? "Removendo…" : "Remover"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
