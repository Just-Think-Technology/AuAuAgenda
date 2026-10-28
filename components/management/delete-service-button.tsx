"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { deleteServiceAction } from "@/app/actions/services";
import { isMocksPublic } from "@/lib/demo/enabled-public";
import { useMockDomainActions } from "@/lib/demo/client-actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export function DeleteServiceButton({ serviceId, name }: { serviceId: string; name: string }) {
	const mocks = isMocksPublic();
	const mockActions = useMockDomainActions();
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	function confirm() {
		startTransition(async () => {
			const result = mocks ? mockActions.removeService(serviceId) : await deleteServiceAction(serviceId);
			if (result.ok) {
				toast.success(result.message);
				setOpen(false);
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<>
			<Button variant="outline" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
				<Trash2Icon />
				Remover
			</Button>
			<Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="gap-2">
						<DialogTitle>Remover {name}?</DialogTitle>
						<DialogDescription>
							O serviço sai do catálogo. Agendamentos já feitos continuam na agenda.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
							Voltar
						</Button>
						<Button variant="destructive" onClick={confirm} disabled={isPending}>
							{isPending ? "Removendo…" : "Remover"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
