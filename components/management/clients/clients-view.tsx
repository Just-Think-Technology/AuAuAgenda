"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteClientAction } from "@/app/actions/admin-clients";
import { isMocksPublic } from "@/lib/config/mocks-public";
import { useMockDomainActions } from "@/lib/mock/client-actions";
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
import { formatCpf, isValidCpf } from "@/lib/domain/cpf";
import { formatPhone } from "@/lib/format";

import { buildColumns, type ManagedClient } from "./columns";
import { DataTable } from "./data-table";

export function ClientsView({ clients }: { clients: ManagedClient[] }) {
	const mocks = isMocksPublic();
	const mockActions = useMockDomainActions();
	const [activeCpf, setActiveCpf] = useState<string | null>(null);
	const [cpfToDelete, setCpfToDelete] = useState<string | null>(null);
	const [isDeleting, startDelete] = useTransition();
	const columns = useMemo(() => buildColumns({ onDelete: setCpfToDelete }), []);
	const active = clients.find((c) => c.cpf === activeCpf) ?? null;
	const toDelete = clients.find((c) => c.cpf === cpfToDelete) ?? null;

	function confirmDelete() {
		if (!cpfToDelete) return;
		startDelete(async () => {
			const result = mocks
				? mockActions.removeClient(cpfToDelete)
				: await deleteClientAction(cpfToDelete);
			if (result.ok) {
				toast.success(result.message);
				if (activeCpf === cpfToDelete) setActiveCpf(null);
				setCpfToDelete(null);
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
				onRowClick={(row) => setActiveCpf(row.cpf)}
				isRowActive={(row) => row.cpf === activeCpf}
			/>

			<Sheet open={Boolean(active)} onOpenChange={(open) => !open && setActiveCpf(null)}>
				<SheetContent className="w-full overflow-y-auto sm:max-w-md">
					{active && (
						<>
							<SheetHeader>
								<SheetTitle>{active.name}</SheetTitle>
								<SheetDescription>
									{[
										active.email,
										isValidCpf(active.cpf) ? formatCpf(active.cpf) : null,
										formatPhone(active.phone),
									]
										.filter((part) => part && part !== "—")
										.join(" · ") || "Sem contato informado"}
								</SheetDescription>
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

			<Dialog open={Boolean(cpfToDelete)} onOpenChange={(open) => !open && !isDeleting && setCpfToDelete(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="gap-2">
						<DialogTitle>Remover {toDelete?.name}?</DialogTitle>
						<DialogDescription>
							A conta, os pets e os agendamentos deste cliente saem da operação. Os registros ficam arquivados.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCpfToDelete(null)} disabled={isDeleting}>
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
