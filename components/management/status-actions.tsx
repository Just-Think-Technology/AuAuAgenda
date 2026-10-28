"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { changeAppointmentStatusAction } from "@/app/actions/agenda";
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
import { nextStatuses, type AppointmentStatus } from "@/lib/domain/appointment-status";

const ACTION_LABELS: Record<AppointmentStatus, string> = {
	SCHEDULED: "Reabrir",
	CONFIRMED: "Confirmar",
	IN_SERVICE: "Iniciar atendimento",
	COMPLETED: "Concluir",
	CANCELED: "Cancelar",
	NO_SHOW: "Não compareceu",
};

const NEEDS_CONFIRMATION: readonly AppointmentStatus[] = ["CANCELED", "NO_SHOW"];

export function StatusActions({
	appointmentId,
	status,
	summary,
}: {
	appointmentId: number;
	status: AppointmentStatus;
	summary: string;
}) {
	const mocks = isMocksPublic();
	const mockActions = useMockDomainActions();
	const [isPending, startTransition] = useTransition();
	const [pendingConfirm, setPendingConfirm] = useState<AppointmentStatus | null>(null);
	const options = nextStatuses(status);
	if (options.length === 0) return null;

	function apply(to: AppointmentStatus) {
		startTransition(async () => {
			const result = mocks
				? mockActions.changeStatus(appointmentId, status, to)
				: await changeAppointmentStatusAction({ appointmentId, from: status, to });
			if (result.ok) toast.success(result.message);
			else toast.error(result.error);
			setPendingConfirm(null);
		});
	}

	return (
		<>
			<div className="flex flex-wrap gap-2">
				{options.map((to) => {
					const destructive = NEEDS_CONFIRMATION.includes(to);
					return (
						<Button
							key={to}
							size="sm"
							variant={destructive ? "outline" : "default"}
							className={destructive ? "text-destructive" : undefined}
							disabled={isPending}
							onClick={() => (destructive ? setPendingConfirm(to) : apply(to))}
						>
							{ACTION_LABELS[to]}
						</Button>
					);
				})}
			</div>

			<Dialog open={pendingConfirm !== null} onOpenChange={(open) => !open && !isPending && setPendingConfirm(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="gap-2">
						<DialogTitle>
							{pendingConfirm === "CANCELED" ? "Cancelar agendamento?" : "Registrar não comparecimento?"}
						</DialogTitle>
						<DialogDescription>{summary}. Essa alteração libera o horário e não pode ser desfeita.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPendingConfirm(null)} disabled={isPending}>
							Voltar
						</Button>
						<Button
							variant="destructive"
							disabled={isPending}
							onClick={() => pendingConfirm && apply(pendingConfirm)}
						>
							{isPending ? "Salvando…" : "Confirmar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
