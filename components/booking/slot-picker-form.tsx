"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
	createAppointmentAction,
	rescheduleAppointmentAction,
} from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { isMocksPublic } from "@/lib/config/mocks-public";
import { DomainError } from "@/lib/domain/errors";
import { toast } from "sonner";
import { useMockDomainActions } from "@/lib/mock/client-actions";
import { cn } from "@/lib/utils";

export type SlotOption = { value: string; label: string; freeStations: number };

type Props = {
	mode: "create" | "reschedule";
	slots: SlotOption[];
	hiddenFields: Record<string, string>;
	defaultNotes?: string | null;
	clientCpf?: string;
	excludeId?: number;
};

const ACTIONS = {
	create: createAppointmentAction,
	reschedule: rescheduleAppointmentAction,
};

function readStartsAt(value: string): Date {
	const date = value ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) throw new DomainError("Escolha um horário.");
	return date;
}

export function SlotPickerForm({ mode, slots, hiddenFields, defaultNotes, clientCpf }: Props) {
	const mocks = isMocksPublic() && Boolean(clientCpf);
	const [state, formAction, isPending] = useActionState(ACTIONS[mode], undefined);
	const mockActions = useMockDomainActions();
	const [mockPending, startMock] = useTransition();
	const [selected, setSelected] = useState("");
	const [notes, setNotes] = useState(defaultNotes ?? "");
	const router = useRouter();

	useActionFeedback(state, undefined, () => {
		setSelected("");
		router.refresh();
	});

	function submitMock(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!clientCpf || !selected) return;
		startMock(() => {
			try {
				const startsAt = readStartsAt(selected);
				const noteText = notes.trim() || null;
				if (mode === "create") {
					const petId = hiddenFields.pet_id;
					const serviceId = hiddenFields.service_id;
					if (!petId || !serviceId) return;
					const result = mockActions.createAppointment(clientCpf, {
						petId,
						serviceId,
						startsAt,
						notes: noteText,
					});
					if (!result?.ok) throw new DomainError(result?.error ?? "Erro ao agendar.");
					router.push("/cliente/agendamentos?criado=1");
					return;
				}
				const appointmentId = Number(hiddenFields.appointment_id);
				if (!Number.isSafeInteger(appointmentId)) return;
				const result = mockActions.rescheduleAppointment(
					clientCpf,
					appointmentId,
					startsAt,
					noteText,
				);
				if (!result?.ok) throw new DomainError(result?.error ?? "Erro ao remarcar.");
				router.push("/cliente/agendamentos?remarcado=1");
			} catch (error) {
				toast.error(error instanceof DomainError ? error.message : "Não foi possível confirmar.");
				setSelected("");
				router.refresh();
			}
		});
	}

	const pending = mocks ? mockPending : isPending;

	return (
		<form
			action={mocks ? undefined : formAction}
			onSubmit={mocks ? submitMock : undefined}
			className="space-y-5"
		>
			{Object.entries(hiddenFields).map(([name, value]) => (
				<input key={name} type="hidden" name={name} value={value} />
			))}

			<fieldset>
				<legend className="sr-only">Horários disponíveis</legend>
				<div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
					{slots.map((slot) => (
						<label
							key={slot.value}
							className={cn(
								"flex cursor-pointer flex-col items-center rounded-[10px] border bg-white px-2 py-2 text-sm font-medium transition-colors",
								"has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary hover:border-primary",
								selected === slot.value && "border-primary bg-primary text-primary-foreground",
							)}
						>
							<input
								type="radio"
								name="starts_at"
								value={slot.value}
								required
								className="sr-only"
								checked={selected === slot.value}
								onChange={() => setSelected(slot.value)}
							/>
							{slot.label}
						</label>
					))}
				</div>
			</fieldset>

			<div className="flex max-w-xl flex-col gap-2">
				<Label htmlFor="notes">Observações para a equipe (opcional)</Label>
				<Textarea
					id="notes"
					name="notes"
					maxLength={500}
					value={notes}
					onChange={(event) => setNotes(event.target.value)}
					placeholder="Ex.: pet fica agitado com secador, preferência de corte…"
				/>
			</div>

			<Button type="submit" disabled={pending || !selected}>
				{pending
					? "Confirmando…"
					: mode === "create"
						? "Confirmar agendamento"
						: "Confirmar novo horário"}
			</Button>
		</form>
	);
}
