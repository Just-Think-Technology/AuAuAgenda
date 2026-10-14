"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";

import {
	createAppointmentAction,
	rescheduleAppointmentAction,
} from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { cn } from "@/lib/utils";

export type SlotOption = { value: string; label: string; freeStations: number };

type Props = {
	mode: "create" | "reschedule";
	slots: SlotOption[];
	hiddenFields: Record<string, string>;
	defaultNotes?: string | null;
};

const ACTIONS = {
	create: createAppointmentAction,
	reschedule: rescheduleAppointmentAction,
};

export function SlotPickerForm({ mode, slots, hiddenFields, defaultNotes }: Props) {
	const [state, formAction, isPending] = useActionState(ACTIONS[mode], undefined);
	const [selected, setSelected] = useState("");
	const router = useRouter();
	// A rejected slot usually means the list is stale; reload it from the server.
	useActionFeedback(state, undefined, () => {
		setSelected("");
		router.refresh();
	});

	return (
		<form action={formAction} className="space-y-5">
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
					defaultValue={defaultNotes ?? ""}
					placeholder="Ex.: pet fica agitado com secador, preferência de corte…"
				/>
			</div>

			<Button type="submit" disabled={isPending || !selected}>
				{isPending
					? "Confirmando…"
					: mode === "create"
						? "Confirmar agendamento"
						: "Confirmar novo horário"}
			</Button>
		</form>
	);
}
