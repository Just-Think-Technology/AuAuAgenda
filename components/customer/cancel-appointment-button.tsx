"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cancelAppointmentAction } from "@/app/actions/appointments";
import { isMocksPublic } from "@/lib/config/mocks-public";
import { useMockDomainActions } from "@/lib/mock/client-actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export function CancelAppointmentButton({
	appointmentId,
	summary,
	clientCpf,
}: {
	appointmentId: number;
	summary: string;
	clientCpf?: string;
}) {
	const mocks = isMocksPublic() && Boolean(clientCpf);
	const mockActions = useMockDomainActions();
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	function confirm() {
		startTransition(async () => {
			const result =
				mocks && clientCpf
					? mockActions.cancelAppointment(clientCpf, appointmentId)
					: await cancelAppointmentAction(appointmentId);
			if (result.ok) {
				toast.success(result.message);
				setOpen(false);
			} else {
				toast.error(result.error);
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					Cancelar
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="gap-2">
					<DialogTitle>Cancelar agendamento?</DialogTitle>
					<DialogDescription>
						{summary}. O horário ficará livre para outros clientes.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
						Manter
					</Button>
					<Button variant="destructive" onClick={confirm} disabled={isPending}>
						{isPending ? "Cancelando…" : "Cancelar agendamento"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
